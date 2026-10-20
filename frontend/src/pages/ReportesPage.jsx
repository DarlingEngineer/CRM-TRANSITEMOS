import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarDays,
  Clock,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Ticket as TicketIcon,
} from 'lucide-react';
import {
  Area, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, Line, LabelList, ComposedChart,
} from 'recharts';
import AppLayout from '../layouts/AppLayout';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import { CategoryTick, ChartTooltip } from '../components/ChartVisuals';
import { ErrorBanner, Loading } from '../components/Feedback';
import { apiFetch } from '../apiClient';
import { useToast } from '../context/ToastContext';
import logoUrl from '../assets/logo.png';
import {
  SERIES_COLOR,
  PRIORITY_ORDER,
  PRIORITY_COLORS,
  CHART_GRID,
  CHART_CURSOR,
  LINE_CURSOR,
  AXIS_TICK,
  VALUE_LABEL,
} from '../utils/chartTheme';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const TICKET_PAGE_SIZE = 100;
const MAX_TICKET_PAGES = 100;

function dedupeTickets(tickets) {
  const seen = new Set();
  return tickets.filter((ticket) => {
    if (!ticket || typeof ticket !== 'object') return false;
    const key = ticket.id != null
      ? `id-${ticket.id}`
      : `${ticket.title || ''}|${ticket.created_at || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchAllTickets() {
  const all = [];
  let skip = 0;
  let complete = true;

  for (let page = 0; page < MAX_TICKET_PAGES; page += 1) {
    let response;
    try {
      response = await apiFetch(`/tickets/?skip=${skip}&limit=${TICKET_PAGE_SIZE}`);
    } catch {
      complete = false;
      break;
    }

    if (!response.ok) {
      complete = false;
      break;
    }

    let data;
    try {
      data = await response.json();
    } catch {
      complete = false;
      break;
    }

    if (!Array.isArray(data)) {
      complete = false;
      break;
    }

    const before = all.length;
    all.push(...data);
    const unique = dedupeTickets(all);
    all.length = 0;
    all.push(...unique);
    const added = all.length - before;

    if (data.length !== TICKET_PAGE_SIZE) {
      complete = true;
      break;
    }
    if (added === 0) {
      complete = false;
      break;
    }

    skip += TICKET_PAGE_SIZE;
    if (page === MAX_TICKET_PAGES - 1) complete = false;
  }

  return { tickets: dedupeTickets(all), complete };
}

export default function ReportesPage() {
  const { showToast } = useToast() || {};
  const [porMes, setPorMes] = useState([]);
  const [porArea, setPorArea] = useState([]);
  const [tiempo, setTiempo] = useState(null);
  const [porPrioridad, setPorPrioridad] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketsIncomplete, setTicketsIncomplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [error, setError] = useState('');
  const exportingRef = useRef(false);

  const loadReportes = useCallback(async (isActive = () => true) => {
    setLoading(true);
    setError('');
    try {
      const [r1, r2, r3, ticketResult] = await Promise.all([
        apiFetch('/metrics/tickets-per-month'),
        apiFetch('/metrics/tickets-per-area'),
        apiFetch('/metrics/response-time'),
        fetchAllTickets(),
      ]);

      if (!r1.ok || !r2.ok || !r3.ok) {
        throw new Error('No se pudieron cargar las métricas.');
      }

      const mes = await r1.json();
      const area = await r2.json();
      const tiempoData = await r3.json();
      const lista = ticketResult.tickets;

      const counts = {};
      lista.forEach((ticket) => {
        counts[ticket.priority] = (counts[ticket.priority] || 0) + 1;
      });
      const prioridad = PRIORITY_ORDER
        .filter((name) => counts[name])
        .map((name) => ({ name, total: counts[name] }));

      if (!isActive()) return;

      setPorMes(Array.isArray(mes) ? mes : []);
      setPorArea(Array.isArray(area) ? area : []);
      setTiempo(tiempoData);
      setPorPrioridad(prioridad);
      setTickets(lista);
      setTicketsIncomplete(!ticketResult.complete);
      if (!ticketResult.complete) {
        setError('No se pudo cargar el listado completo de tickets. Las métricas están disponibles, pero el detalle del reporte puede estar incompleto.');
      }
    } catch (err) {
      if (isActive()) setError(err.message);
    } finally {
      if (isActive()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    loadReportes(() => active);
    return () => {
      active = false;
    };
  }, [loadReportes]);

  const buildExportData = () => {
    const generatedAt = new Date();
    const scopeNote = ticketsIncomplete
      ? `Se incluyen ${tickets.length} ticket(s). El listado puede estar incompleto porque no fue posible cargar todas las páginas.`
      : tickets.length
        ? `Se incluyen ${tickets.length} ticket(s) disponibles en el sistema. Sin filtros adicionales.`
        : 'No hay tickets disponibles en el sistema para incluir en el detalle.';
    return {
      tickets,
      porMes,
      porArea,
      porPrioridad,
      tiempo,
      generatedAt,
      logoUrl,
      scopeNote,
    };
  };

  const exportExcel = async () => {
    if (exportingRef.current || loading) return;
    exportingRef.current = true;
    setExportingExcel(true);
    try {
      const { downloadExcelReport } = await import('../utils/reportExcel');
      const filename = await downloadExcelReport(buildExportData());
      showToast?.(`Excel generado: ${filename}`, 'success');
    } catch (err) {
      console.error('No se pudo generar el Excel:', err);
      setError('No se pudo generar el reporte Excel. Verifica que el navegador permita descargas e intenta nuevamente.');
      showToast?.('No se pudo generar el reporte Excel.', 'error');
    } finally {
      exportingRef.current = false;
      setExportingExcel(false);
    }
  };

  const exportPdf = async () => {
    if (exportingRef.current || loading) return;
    exportingRef.current = true;
    setExportingPdf(true);
    try {
      const { downloadPdfReport } = await import('../utils/reportPdf');
      const filename = await downloadPdfReport(buildExportData());
      showToast?.(`PDF generado: ${filename}`, 'success');
    } catch (err) {
      console.error('No se pudo generar el PDF:', err);
      setError('No se pudo generar el reporte PDF. Verifica que el navegador permita descargas e intenta nuevamente.');
      showToast?.('No se pudo generar el reporte PDF.', 'error');
    } finally {
      exportingRef.current = false;
      setExportingPdf(false);
    }
  };

  const urgentes = porPrioridad.find((item) => item.name === 'Urgente')?.total || 0;
  const horas = tiempo?.average_hours;
  const monthData = porMes.map((item) => ({
    name: `${MESES[item.month - 1]} ${item.year}`,
    total: item.total,
  }));
  const priorityData = porPrioridad.map((entry) => ({
    ...entry,
    fill: PRIORITY_COLORS[entry.name] || SERIES_COLOR,
  }));
  const priorityTotal = priorityData.reduce((total, entry) => total + Number(entry.total || 0), 0);
  const areaTotal = porArea.reduce((total, entry) => total + Number(entry.total || 0), 0);

  return (
    <AppLayout>
      <div className="page page--reports">
        <PageHeader
          eyebrow="Administración"
          title="Reportes y KPIs"
          subtitle="Métricas generales del sistema de solicitudes y exportación de información."
          actions={(
            <>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => loadReportes()}
                disabled={loading || exportingExcel || exportingPdf}
              >
                <RefreshCw size={16} aria-hidden="true" />
                Actualizar
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={exportExcel}
                disabled={loading || exportingExcel || exportingPdf}
              >
                {exportingExcel ? (
                  <>
                    <span className="spinner spinner--sm" aria-hidden="true" />
                    Generando…
                  </>
                ) : (
                  <>
                    <FileSpreadsheet size={16} aria-hidden="true" />
                    Excel detallado
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={exportPdf}
                disabled={loading || exportingExcel || exportingPdf}
              >
                {exportingPdf ? (
                  <>
                    <span className="spinner spinner--sm spinner--light" aria-hidden="true" />
                    Generando…
                  </>
                ) : (
                  <>
                    <Download size={16} aria-hidden="true" />
                    Reporte PDF
                  </>
                )}
              </button>
            </>
          )}
        />

        <ErrorBanner message={error} />

        {loading ? (
          <Loading text="Cargando métricas…" />
        ) : (
          <div className="reports-body">
            <div className="report-stats">
              <StatCard
                label="Tickets registrados"
                value={tickets.length}
                hint="Base analizada en el reporte"
                icon={TicketIcon}
                tone="brand"
              />
              <StatCard
                label="Tiempo promedio"
                value={horas != null ? `${horas.toFixed(1)} h` : '—'}
                hint="Resolución o cierre"
                icon={Clock}
                tone="info"
              />
              <StatCard
                label="Áreas con solicitudes"
                value={porArea.length}
                hint="Dependencias involucradas"
                icon={Building2}
                tone="warning"
              />
              <StatCard
                label="Prioridad urgente"
                value={urgentes}
                hint="Requieren atención inmediata"
                icon={AlertTriangle}
                tone="violet"
              />
            </div>

            <div className="grid-charts grid-charts--reports">
              <ChartCard
                title="Tickets por mes"
                description="Evolución mensual del volumen de tickets creados en el sistema."
                icon={CalendarDays}
                tone="brand"
                meta={`${monthData.length} meses`}
              >
                {monthData.length === 0 ? (
                  <p className="chart-empty">Sin datos disponibles para este periodo.</p>
                ) : (
                  <div className="chart-fill">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={monthData}
                        margin={{ top: 16, right: 16, left: -12, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="report-month-area" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={SERIES_COLOR} stopOpacity={0.24} />
                            <stop offset="100%" stopColor={SERIES_COLOR} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid {...CHART_GRID} vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={AXIS_TICK}
                          axisLine={false}
                          tickLine={false}
                          tickMargin={10}
                          minTickGap={18}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={AXIS_TICK}
                          axisLine={false}
                          tickLine={false}
                          width={34}
                        />
                        <Tooltip content={<ChartTooltip />} cursor={LINE_CURSOR} />
                        <Area
                          type="monotone"
                          dataKey="total"
                          stroke="none"
                          fill="url(#report-month-area)"
                          isAnimationActive={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke={SERIES_COLOR}
                          strokeWidth={2.4}
                          strokeLinecap="round"
                          dot={{ r: 3.5, fill: '#ffffff', stroke: SERIES_COLOR, strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: SERIES_COLOR, stroke: '#ffffff', strokeWidth: 2 }}
                          isAnimationActive={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </ChartCard>

              <ChartCard
                title="Tickets por área"
                description="Volumen de solicitudes por dependencia, ordenado de mayor a menor."
                icon={Building2}
                tone="info"
                meta={`${porArea.length} áreas`}
              >
                {porArea.length === 0 ? (
                  <p className="chart-empty">Sin datos disponibles para este periodo.</p>
                ) : (
                  <div className="chart-fill">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[...porArea].sort((a, b) => b.total - a.total)}
                        layout="vertical"
                        margin={{ top: 2, right: 30, left: 0, bottom: 2 }}
                        barCategoryGap="22%"
                      >
                        <defs>
                          <linearGradient id="report-area-bar" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#0b4f78" />
                            <stop offset="100%" stopColor={SERIES_COLOR} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid {...CHART_GRID} horizontal={false} />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          tick={AXIS_TICK}
                          axisLine={false}
                          tickLine={false}
                          tickMargin={6}
                        />
                        <YAxis
                          type="category"
                          dataKey="area"
                          tick={<CategoryTick maxChars={16} />}
                          axisLine={false}
                          tickLine={false}
                          width={118}
                        />
                        <Tooltip
                          content={<ChartTooltip total={areaTotal} showPercent />}
                          cursor={CHART_CURSOR}
                        />
                        <Bar
                          dataKey="total"
                          fill="url(#report-area-bar)"
                          radius={[0, 6, 6, 0]}
                          barSize={16}
                          background={{ fill: '#f6f9fc' }}
                          isAnimationActive={false}
                        >
                          <LabelList dataKey="total" position="right" offset={6} style={VALUE_LABEL} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </ChartCard>

              <ChartCard
                title="Tickets por prioridad"
                description="Reparto de tickets según el nivel de prioridad registrado."
                icon={BarChart3}
                tone="warning"
                meta={`${priorityTotal} tickets`}
              >
                {priorityData.length === 0 ? (
                  <p className="chart-empty">Sin datos disponibles para este periodo.</p>
                ) : (
                  <div className="chart-fill">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={priorityData}
                        margin={{ top: 18, right: 10, left: -10, bottom: 0 }}
                        barCategoryGap="30%"
                      >
                        <defs>
                          {priorityData.map((entry, index) => (
                            <linearGradient
                              key={entry.name}
                              id={`report-priority-${index}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="0%" stopColor={entry.fill} stopOpacity={0.95} />
                              <stop offset="100%" stopColor={entry.fill} stopOpacity={0.7} />
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid {...CHART_GRID} vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={AXIS_TICK}
                          axisLine={false}
                          tickLine={false}
                          tickMargin={8}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={AXIS_TICK}
                          axisLine={false}
                          tickLine={false}
                          width={30}
                        />
                        <Tooltip
                          content={<ChartTooltip total={priorityTotal} showPercent />}
                          cursor={CHART_CURSOR}
                        />
                        <Bar
                          dataKey="total"
                          radius={[7, 7, 0, 0]}
                          maxBarSize={54}
                          background={{ fill: '#f6f9fc' }}
                          isAnimationActive={false}
                        >
                          {priorityData.map((entry, index) => (
                            <Cell key={entry.name} fill={`url(#report-priority-${index})`} />
                          ))}
                          <LabelList dataKey="total" position="top" offset={6} style={VALUE_LABEL} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </ChartCard>

              <ChartCard
                title="Tiempo promedio de resolución"
                description="Promedio de horas invertidas en resolver o cerrar un ticket."
                icon={Clock}
                tone="success"
                footer={`${tiempo?.resolved_tickets_count ?? 0} ticket(s) resuelto(s) o cerrado(s)`}
              >
                {(() => {
                  const pct = horas != null ? Math.min((horas / 24) * 100, 100) : 0;
                  return (
                    <div className="resolution-ring-wrap">
                      <div
                        className="resolution-ring"
                        role="img"
                        aria-label={`Tiempo promedio de resolución: ${horas != null ? `${horas.toFixed(1)} horas` : 'sin datos'}`}
                        style={{
                          background: `conic-gradient(from -90deg, #0b4f78 0%, ${SERIES_COLOR} ${pct}%, #e8eff7 ${pct}%, #e8eff7 100%)`,
                        }}
                      >
                        <div className="resolution-ring__inner">
                          <span className="resolution-ring__value">
                            {horas != null ? horas.toFixed(1) : '—'}
                          </span>
                          <span className="resolution-ring__unit">horas</span>
                        </div>
                      </div>
                      <div className="resolution-ring__scale" aria-hidden="true">
                        <span>0 h</span>
                        <span>24 h</span>
                      </div>
                    </div>
                  );
                })()}
              </ChartCard>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
