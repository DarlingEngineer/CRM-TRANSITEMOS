import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Archive,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  Inbox,
  PieChart as PieChartIcon,
  PlusCircle,
  RefreshCw,
  Ticket as TicketIcon,
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
import {
  STATUS_COLORS,
  PRIORITY_COLORS,
  PRIORITY_ORDER,
  SERIES_COLOR,
  CHART_GRID,
  CHART_CURSOR,
  AXIS_TICK,
  VALUE_LABEL,
} from '../utils/chartTheme';

const formatDate = (iso) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

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

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const metrics = useMemo(() => {
    const byStatus = (value) => tickets.filter(
      (ticket) => (ticket.status || '').toLowerCase() === value,
    ).length;

    const byPriority = (value) => tickets.filter(
      (ticket) => (ticket.priority || '').toLowerCase() === value,
    ).length;

    const areas = tickets.reduce((acc, ticket) => {
      const name = ticket.area || 'Sin área';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

    return {
      total: tickets.length,
      abiertos: byStatus('abierto'),
      enProceso: byStatus('en proceso'),
      resueltos: byStatus('resuelto'),
      cerrados: byStatus('cerrado'),
      prioridades: {
        Baja: byPriority('baja'),
        Media: byPriority('media'),
        Alta: byPriority('alta'),
        Urgente: byPriority('urgente'),
      },
      areas,
    };
  }, [tickets]);

  const recientes = useMemo(
    () => [...tickets]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 8),
    [tickets],
  );

  const statusData = [
    { name: 'Abiertas', value: metrics.abiertos, fill: STATUS_COLORS.Abierto },
    { name: 'En proceso', value: metrics.enProceso, fill: STATUS_COLORS['En proceso'] },
    { name: 'Resueltas', value: metrics.resueltos, fill: STATUS_COLORS.Resuelto },
    { name: 'Cerradas', value: metrics.cerrados, fill: STATUS_COLORS.Cerrado },
  ];

  const priorityData = PRIORITY_ORDER.map((name) => ({
    name,
    total: metrics.prioridades[name],
    fill: PRIORITY_COLORS[name],
  }));

  const areaData = Object.entries(metrics.areas)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  return (
    <AppLayout>
      <div className="page page--dashboard">
        <PageHeader
          eyebrow="Panel ejecutivo"
          title="Dashboard"
          subtitle="Indicadores generales de las solicitudes registradas en el sistema."
          actions={(
            <>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={fetchTickets}
                disabled={loading}
              >
                <RefreshCw size={16} aria-hidden="true" />
                Actualizar
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => navigate('/generar-ticket')}
              >
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
              <StatCard
                label="Total"
                value={metrics.total}
                hint="Solicitudes registradas"
                icon={TicketIcon}
                tone="brand"
                onClick={() => navigate('/tickets')}
              />
              <StatCard
                label="Abiertas"
                value={metrics.abiertos}
                hint="Pendientes de atención"
                icon={Inbox}
                tone="info"
                onClick={() => navigate('/tickets')}
              />
              <StatCard
                label="En proceso"
                value={metrics.enProceso}
                hint="En gestión actualmente"
                icon={Clock}
                tone="warning"
                onClick={() => navigate('/tickets')}
              />
              <StatCard
                label="Resueltas"
                value={metrics.resueltos}
                hint="Atendidas correctamente"
                icon={CheckCircle2}
                tone="success"
                onClick={() => navigate('/tickets')}
              />
              <StatCard
                label="Cerradas"
                value={metrics.cerrados}
                hint="Finalizadas y archivadas"
                icon={Archive}
                tone="violet"
                onClick={() => navigate('/tickets')}
              />
            </div>

            <div className="grid-charts">
              <ChartCard
                title="Distribución por estado"
                description="Solicitudes agrupadas según su estado actual en el flujo de atención."
                icon={PieChartIcon}
                tone="brand"
                meta={`${metrics.total} registros`}
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
                      <Tooltip content={<ChartTooltip total={metrics.total} showPercent />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center" aria-hidden="true">
                    <strong>{metrics.total}</strong>
                    <span>Solicitudes</span>
                  </div>
                </div>

                <div className="chart-legend chart-legend--donut">
                  {statusData.map((item) => {
                    const pct = metrics.total ? Math.round((item.value / metrics.total) * 100) : 0;
                    return (
                      <span className="chart-legend__item" key={item.name}>
                        <i style={{ background: item.fill }} aria-hidden="true" />
                        <span className="chart-legend__name">{item.name}</span>
                        <strong className="chart-legend__value">{item.value}</strong>
                        <small className="chart-legend__pct">{pct}%</small>
                      </span>
                    );
                  })}
                </div>
              </ChartCard>

              <ChartCard
                title="Solicitudes por prioridad"
                description="Volumen de solicitudes según el nivel de prioridad asignado."
                icon={BarChart3}
                tone="info"
                meta={`${metrics.total} registros`}
              >
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
                            id={`dash-priority-${index}`}
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
                        content={<ChartTooltip total={metrics.total} showPercent />}
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
                          <Cell key={entry.name} fill={`url(#dash-priority-${index})`} />
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
                      <BarChart
                        layout="vertical"
                        data={areaData}
                        margin={{ top: 2, right: 30, left: 0, bottom: 2 }}
                        barCategoryGap="24%"
                      >
                        <defs>
                          <linearGradient id="dash-area-bar" x1="0" y1="0" x2="1" y2="0">
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
                          dataKey="name"
                          width={118}
                          tick={<CategoryTick maxChars={16} />}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          content={<ChartTooltip total={metrics.total} showPercent />}
                          cursor={CHART_CURSOR}
                        />
                        <Bar
                          dataKey="total"
                          fill="url(#dash-area-bar)"
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
                      recientes.map((ticket) => (
                        <tr key={ticket.id} className="is-clickable" onClick={() => navigate('/tickets')}>
                          <td className="cell-id">#{ticket.id}</td>
                          <td>
                            <span className="cell-title" title={ticket.title}>{ticket.title}</span>
                            <span className="cell-sub">
                              {ticket.updated_by
                                ? `Actualizado por ${ticket.updated_by}`
                                : 'Sin actualizaciones'}
                            </span>
                          </td>
                          <td><span className="chip">{ticket.area || 'Sin área'}</span></td>
                          <td><PriorityBadge priority={ticket.priority} /></td>
                          <td><StatusBadge status={ticket.status} /></td>
                          <td className="cell-muted">
                            <time dateTime={ticket.created_at || undefined}>
                              {formatDate(ticket.created_at)}
                            </time>
                          </td>
                        </tr>
                      ))
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
