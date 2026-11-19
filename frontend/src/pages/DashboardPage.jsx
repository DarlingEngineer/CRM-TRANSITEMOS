import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Archive, BarChart3, Building2, CheckCircle2, Clock,
  Inbox, PieChart as PieChartIcon, PlusCircle, RefreshCw, Ticket as TicketIcon,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, LabelList, CartesianGrid,
} from 'recharts';
import AppLayout from '../layouts/AppLayout';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import { CategoryTick, ChartTooltip } from '../components/ChartVisuals';
import { ErrorBanner, Loading, EmptyState, StatusBadge, PriorityBadge } from '../components/Feedback';
import { apiFetch } from '../apiClient';
import { PRIORITY_ORDER, SERIES_COLOR, CHART_GRID, CHART_CURSOR, AXIS_TICK, VALUE_LABEL } from '../utils/chartTheme';

const SEMAFORO_STATUS = {
  Abierto: '#3B82F6',
  'En proceso': '#F59E0B',
  Resuelto: '#10B981',
  Cerrado: '#64748B',
};

const SEMAFORO_PRIORITY = {
  Baja: '#10B981',
  Media: '#F59E0B',
  Alta: '#F97316',
  Urgente: '#EF4444',
};

const getTimeSemaforo = (ticket) => {
  const st = (ticket.status || '').toLowerCase();
  if (st === 'resuelto' || st === 'cerrado') return { color: '#10B981', tip: 'Finalizado a tiempo' };
  const dias = ticket.created_at ? Math.floor((Date.now() - new Date(ticket.created_at)) / 86400000) : 0;
  if (dias >= 5) return { color: '#EF4444', tip: `Crítico: ${dias} días abierto` };
  if (dias >= 2) return { color: '#F59E0B', tip: `Seguimiento: ${dias} días abierto` };
  return { color: '#10B981', tip: dias === 0 ? 'Reciente (hoy)' : `A tiempo (${dias}d)` };
};

const formatDate = (iso) => {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const BarGradients = ({ items, prefix }) => (
  <defs>
    {items.map((item, i) => (
      <linearGradient key={item.name} id={`${prefix}-${i}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={item.fill} stopOpacity={0.95} />
        <stop offset="100%" stopColor={item.fill} stopOpacity={0.7} />
      </linearGradient>
    ))}
  </defs>
);

export default function DashboardPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchTickets = useCallback(async () => {
    try {
      const res = await apiFetch('/tickets/?limit=100');
      if (!res.ok) throw new Error('No se pudo conectar con el servidor.');
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const { total, statCards, statusData, priorityData, areaData, recientes } = useMemo(() => {
    const st = { abierto: 0, 'en proceso': 0, resuelto: 0, cerrado: 0 };
    const pr = { baja: 0, media: 0, alta: 0, urgente: 0 };
    const areas = {};

    for (const t of tickets) {
      const sKey = (t.status || '').toLowerCase();
      const pKey = (t.priority || '').toLowerCase();
      const area = t.area || 'Sin área';
      if (sKey in st) st[sKey] += 1;
      if (pKey in pr) pr[pKey] += 1;
      areas[area] = (areas[area] || 0) + 1;
    }

    const count = tickets.length;
    return {
      total: count,
      statCards: [
        { label: 'Total', value: count, hint: 'Solicitudes registradas', icon: TicketIcon, tone: 'brand' },
        { label: 'Abiertas', value: st.abierto, hint: 'Pendientes de atención', icon: Inbox, tone: 'info' },
        { label: 'En proceso', value: st['en proceso'], hint: 'En gestión actualmente', icon: Clock, tone: 'warning' },
        { label: 'Resueltas', value: st.resuelto, hint: 'Atendidas correctamente', icon: CheckCircle2, tone: 'success' },
        { label: 'Cerradas', value: st.cerrado, hint: 'Finalizadas y archivadas', icon: Archive, tone: 'violet' },
      ],
      statusData: [
        { name: 'Abiertas', value: st.abierto, fill: SEMAFORO_STATUS.Abierto },
        { name: 'En proceso', value: st['en proceso'], fill: SEMAFORO_STATUS['En proceso'] },
        { name: 'Resueltas', value: st.resuelto, fill: SEMAFORO_STATUS.Resuelto },
        { name: 'Cerradas', value: st.cerrado, fill: SEMAFORO_STATUS.Cerrado },
      ],
      priorityData: PRIORITY_ORDER.map((name) => ({
        name,
        total: pr[name.toLowerCase()] || 0,
        fill: SEMAFORO_PRIORITY[name],
      })),
      areaData: Object.entries(areas)
        .map(([name, val]) => ({ name, total: val }))
        .sort((a, b) => b.total - a.total),
      recientes: [...tickets]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 8),
    };
  }, [tickets]);

  const goTickets = () => navigate('/tickets');

  return (
    <AppLayout>
      <div className="page page--dashboard">
        <PageHeader
          eyebrow="Panel ejecutivo"
          title="Dashboard"
          subtitle="Indicadores generales de las solicitudes registradas en el sistema."
          actions={(
            <>
              <button type="button" className="btn btn--secondary" onClick={() => window.location.reload()} disabled={loading}>
                <RefreshCw size={16} aria-hidden="true" />
                Actualizar
              </button>
              <button type="button" className="btn btn--primary" onClick={() => navigate('/generar-ticket')}>
                <PlusCircle size={16} aria-hidden="true" />
                Nueva solicitud
              </button>
            </>
          )}
        />

        <ErrorBanner message={error} />

        {loading ? (
          <Loading text="Cargando indicadores…" />
        ) : (
          <div className="dashboard-body">
            <div className="stat-grid">
              {statCards.map((card) => (
                <StatCard key={card.label} {...card} onClick={goTickets} />
              ))}
            </div>

            <div className="grid-charts">
              <ChartCard
                title="Distribución por estado"
                description="Solicitudes agrupadas según su estado actual en el flujo de atención."
                icon={PieChartIcon}
                tone="brand"
                meta={`${total} registros`}
              >
                <div className="chart-fill chart-fill--donut">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="52%"
                        outerRadius="76%"
                        paddingAngle={2}
                        cornerRadius={6}
                        stroke="#ffffff"
                        strokeWidth={2}
                        isAnimationActive={false}
                      >
                        {statusData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip total={total} showPercent />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center" aria-hidden="true">
                    <strong>{total}</strong>
                    <span>Solicitudes</span>
                  </div>
                </div>

                <div className="chart-legend chart-legend--donut">
                  {statusData.map((item) => (
                    <span className="chart-legend__item" key={item.name}>
                      <i style={{ background: item.fill }} aria-hidden="true" />
                      <span className="chart-legend__name">{item.name}</span>
                      <strong className="chart-legend__value">{item.value}</strong>
                      <small className="chart-legend__pct">
                        {total ? Math.round((item.value / total) * 100) : 0}%
                      </small>
                    </span>
                  ))}
                </div>
              </ChartCard>

              <ChartCard
                title="Solicitudes por prioridad"
                description="Volumen de solicitudes según el nivel de prioridad asignado."
                icon={BarChart3}
                tone="info"
                meta={`${total} registros`}
              >
                <div className="chart-fill">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityData} margin={{ top: 18, right: 10, left: -10, bottom: 0 }} barCategoryGap="30%">
                      <BarGradients items={priorityData} prefix="dash-priority" />
                      <CartesianGrid {...CHART_GRID} vertical={false} />
                      <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} tickMargin={8} />
                      <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} width={30} />
                      <Tooltip content={<ChartTooltip total={total} showPercent />} cursor={CHART_CURSOR} />
                      <Bar dataKey="total" radius={[7, 7, 0, 0]} maxBarSize={54} background={{ fill: '#f6f9fc' }} isAnimationActive={false}>
                        {priorityData.map((entry, i) => (
                          <Cell key={entry.name} fill={`url(#dash-priority-${i})`} />
                        ))}
                        <LabelList dataKey="total" position="top" offset={6} style={VALUE_LABEL} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard
                title="Solicitudes por área"
                description="Volumen de solicitudes por dependencia responsable."
                icon={Building2}
                tone="violet"
                meta={`${areaData.length} áreas`}
              >
                {areaData.length === 0 ? (
                  <EmptyState
                    icon={<Inbox size={20} />}
                    message="Sin áreas registradas"
                    hint="Las áreas aparecerán cuando existan solicitudes asociadas."
                  />
                ) : (
                  <div className="chart-fill">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={areaData} margin={{ top: 2, right: 30, left: 0, bottom: 2 }} barCategoryGap="24%">
                        <defs>
                          <linearGradient id="dash-area-bar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" />
                            <stop offset="45%" stopColor={SERIES_COLOR || '#0284c7'} />
                            <stop offset="100%" stopColor="#082f49" />
                          </linearGradient>
                          <filter id="dash-area-3d" x="-5%" y="-15%" width="115%" height="145%">
                            <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#082f49" floodOpacity="0.28" />
                          </filter>
                        </defs>
                        <CartesianGrid {...CHART_GRID} horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} tickMargin={6} />
                        <YAxis type="category" dataKey="name" width={118} tick={<CategoryTick maxChars={16} />} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip total={total} showPercent />} cursor={CHART_CURSOR} />
                        <Bar
                          dataKey="total"
                          fill="url(#dash-area-bar)"
                          style={{ filter: 'url(#dash-area-3d)' }}
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
            </div>

            <section className="card recent-card">
              <div className="card__header">
                <div>
                  <h2 className="card__title">Solicitudes recientes</h2>
                  <p className="card__subtitle">Últimos tickets registrados en el sistema.</p>
                </div>
                <Link to="/tickets" className="btn btn--ghost btn--sm">
                  Ver todas
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>

              <div className="table-wrap">
                <table className="data-table data-table--recent">
                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>Solicitud</th>
                      <th>Área</th>
                      <th>Prioridad</th>
                      <th>Estado</th>
                      <th>Creado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recientes.length === 0 ? (
                      <tr>
                        <td colSpan="6">
                          <EmptyState
                            icon={<Inbox size={22} />}
                            message="No hay solicitudes registradas"
                            hint="Crea la primera solicitud para comenzar a ver indicadores."
                          />
                        </td>
                      </tr>
                    ) : (
                      recientes.map((ticket) => {
                        const sem = getTimeSemaforo(ticket);
                        return (
                          <tr key={ticket.id} className="is-clickable" onClick={goTickets}>
                            <td className="cell-id" data-label="Ticket">#{ticket.id}</td>
                            <td data-label="Solicitud">
                              <span className="cell-title" title={ticket.title}>{ticket.title}</span>
                              <span className="cell-sub">
                                {ticket.updated_by ? `Actualizado por ${ticket.updated_by}` : 'Sin actualizaciones'}
                              </span>
                            </td>
                            <td data-label="Área"><span className="chip">{ticket.area || 'Sin área'}</span></td>
                            <td data-label="Prioridad"><PriorityBadge priority={ticket.priority} /></td>
                            <td data-label="Estado"><StatusBadge status={ticket.status} /></td>
                            <td className="cell-muted" data-label="Creado">
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} title={sem.tip}>
                                <i
                                  style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: sem.color, flexShrink: 0 }}
                                  aria-hidden="true"
                                />
                                <time dateTime={ticket.created_at || undefined}>{formatDate(ticket.created_at)}</time>
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </AppLayout>
  );
}