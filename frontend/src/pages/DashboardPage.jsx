import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import { apiFetch } from '../apiClient';
import { ErrorBanner, Loading, EmptyState, StatusBadge, PriorityBadge } from '../components/Feedback';
import ChartCard from '../components/ChartCard';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LabelList, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { STATUS_COLORS, PRIORITY_COLORS, SERIES_COLOR, CHART_INK, AXIS_TICK, VALUE_LABEL, TOOLTIP_PROPS } from '../utils/chartTheme';

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
    let active = true;
    (async () => {
      try {
        const res = await apiFetch('/tickets/?limit=100');
        if (!res.ok) throw new Error('No se pudo conectar con el servidor.');
        const data = await res.json();
        if (active) { setTickets(Array.isArray(data) ? data : []); setError(''); }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const totalTickets = tickets.length;
  
  const abiertos = tickets.filter(t => (t.status || '').toLowerCase() === 'abierto').length;
  const enProceso = tickets.filter(t => ['en proceso', 'in_progress'].includes((t.status || '').toLowerCase())).length;
  const resueltos = tickets.filter(t => ['resuelto', 'resolved'].includes((t.status || '').toLowerCase())).length;
  const cerrados = tickets.filter(t => ['cerrado', 'closed'].includes((t.status || '').toLowerCase())).length;

  const baja = tickets.filter(t => (t.priority || '').toLowerCase() === 'baja').length;
  const media = tickets.filter(t => (t.priority || '').toLowerCase() === 'media').length;
  const alta = tickets.filter(t => (t.priority || '').toLowerCase() === 'alta').length;
  const urgente = tickets.filter(t => (t.priority || '').toLowerCase() === 'urgente').length;

  const areasMap = tickets.reduce((acc, t) => {
    const areaName = t.area || 'Sin Área';
    acc[areaName] = (acc[areaName] || 0) + 1;
    return acc;
  }, {});

  return (
    <AppLayout>
      <div style={{ width: '100%', maxWidth: '1320px', margin: '0 auto', boxSizing: 'border-box' }}>
        {/* ENCABEZADO Y ACCIONES */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0b4f78', margin: 0, letterSpacing: '-0.3px' }}>
              📊 Dashboard Ejecutivo
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '3px' }}>
              Tránsito de Mosquera 2026 — Panel administrativo e indicadores generales
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/crear-ticket')}
              style={{ 
                background: '#2563eb', 
                color: '#ffffff', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: '6px', 
                fontWeight: 700, 
                fontSize: '0.85rem', 
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,114,188,0.2)'
              }}>
              + Nuevo Ticket
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchTickets}
              style={{ 
                background: 'var(--card-bg, #ffffff)', 
                color: '#198754', 
                border: '1.5px solid #198754', 
                padding: '7px 15px', 
                borderRadius: '6px', 
                fontWeight: 700, 
                fontSize: '0.85rem', 
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
              🔄 Actualizar
            </motion.button>
          </div>
        </div>

        {/* MENSAJE DE ALERTA RED */}
        <ErrorBanner message={error} />

        {loading ? (
          <Loading />
        ) : (
          <>
            {/* TARJETAS KPI FLUIDAS */}
            <div className="grid-kpis" style={{ marginBottom: '20px' }}>
              <KpiCard title="TOTAL TICKETS" count={totalTickets} color={CHART_INK.brand} hint="Registrados en el sistema" onClick={() => navigate('/tickets')} />
              <KpiCard title="ABIERTOS" count={abiertos} color={STATUS_COLORS.Abierto} hint="Pendientes de atención" onClick={() => navigate('/tickets')} />
              <KpiCard title="EN PROCESO" count={enProceso} color={STATUS_COLORS['En proceso']} hint="En gestión actualmente" onClick={() => navigate('/tickets')} />
              <KpiCard title="RESUELTOS" count={resueltos} color={STATUS_COLORS.Resuelto} hint="Atendidos correctamente" onClick={() => navigate('/tickets')} />
              <KpiCard title="CERRADOS" count={cerrados} color={STATUS_COLORS.Cerrado} hint="Finalizados y archivados" onClick={() => navigate('/tickets')} />
            </div>

            {/* PANELES DE DIBUJO */}
            <div className="grid-charts" style={{ marginBottom: '20px' }}>

              {/* POR ESTADO */}
              <ChartCard title="Distribución por estado" description="Tickets agrupados según su estado actual en el flujo de atención.">
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie data={[{ name: 'Abiertos', value: abiertos }, { name: 'En proceso', value: enProceso }, { name: 'Resueltos', value: resueltos }, { name: 'Cerrados', value: cerrados }]} dataKey="value" nameKey="name" innerRadius={44} outerRadius={74} paddingAngle={2} cornerRadius={4} stroke="#fff" strokeWidth={2}>
                      <Cell fill={STATUS_COLORS.Abierto} />
                      <Cell fill={STATUS_COLORS['En proceso']} />
                      <Cell fill={STATUS_COLORS.Resuelto} />
                      <Cell fill={STATUS_COLORS.Cerrado} />
                    </Pie>
                    <Tooltip {...TOOLTIP_PROPS} formatter={(value, name) => [`${value} ticket(s)`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-legend">
                  <span><i style={{ background: STATUS_COLORS.Abierto }} />Abiertos {abiertos}</span>
                  <span><i style={{ background: STATUS_COLORS['En proceso'] }} />En proceso {enProceso}</span>
                  <span><i style={{ background: STATUS_COLORS.Resuelto }} />Resueltos {resueltos}</span>
                  <span><i style={{ background: STATUS_COLORS.Cerrado }} />Cerrados {cerrados}</span>
                </div>
              </ChartCard>

              {/* POR PRIORIDAD */}
              <ChartCard title="Tickets por prioridad" description="Volumen de solicitudes según el nivel de prioridad asignado.">
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={[{ name: 'Baja', total: baja }, { name: 'Media', total: media }, { name: 'Alta', total: alta }, { name: 'Urgente', total: urgente }]} margin={{ top: 16, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
                    <XAxis dataKey="name" tick={AXIS_TICK} axisLine={{ stroke: CHART_INK.axis }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <Tooltip {...TOOLTIP_PROPS} formatter={(value) => [`${value} ticket(s)`, 'Total']} />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={44}>
                      <Cell fill={PRIORITY_COLORS.Baja} />
                      <Cell fill={PRIORITY_COLORS.Media} />
                      <Cell fill={PRIORITY_COLORS.Alta} />
                      <Cell fill={PRIORITY_COLORS.Urgente} />
                      <LabelList dataKey="total" position="top" style={VALUE_LABEL} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* POR DEPARTAMENTO */}
              <ChartCard title="Tickets por departamento" description="Solicitudes agrupadas por área o dependencia responsable.">
                {Object.keys(areasMap).length === 0 ? (
                  <div style={{ fontSize: '0.82rem', color: '#64748b', textAlign: 'center' }}>Sin áreas registradas</div>
                ) : (
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart layout="vertical" data={Object.entries(areasMap).map(([area, count]) => ({ name: area, total: count })).sort((a, b) => b.total - a.total)} margin={{ left: 10, right: 24, top: 5, bottom: 5 }}>
                      <CartesianGrid horizontal={false} stroke={CHART_INK.grid} />
                      <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={100} tick={AXIS_TICK} axisLine={{ stroke: CHART_INK.axis }} tickLine={false} />
                      <Tooltip {...TOOLTIP_PROPS} formatter={(value) => [`${value} ticket(s)`, 'Total']} />
                      <Bar dataKey="total" fill={SERIES_COLOR} radius={[0, 4, 4, 0]} barSize={14}>
                        <LabelList dataKey="total" position="right" style={VALUE_LABEL} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

            </div>

            {/* TABLA DE TICKETS RECIENTES */}
            <div style={{ background: 'var(--card-bg, #ffffff)', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', width: '100%', boxSizing: 'border-box' }}>
              <h3 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#4b5563', letterSpacing: '0.5px', marginBottom: '16px', textTransform: 'uppercase', textAlign: 'center' }}>TICKETS RECIENTES</h3>
              <div className="table-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'center', color: '#374151', fontSize: '0.72rem', fontWeight: 800 }}>
                    <th style={{ padding: '8px 10px' }}># ID</th>
                    <th style={{ padding: '8px 10px' }}>TÍTULO</th>
                    <th style={{ padding: '8px 10px' }}>ÁREA</th>
                    <th style={{ padding: '8px 10px' }}>ESTADO</th>
                    <th style={{ padding: '8px 10px' }}>PRIORIDAD</th>
                    <th style={{ padding: '8px 10px' }}>FECHA CREACIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan="6"><EmptyState icon="📊" message="No hay tickets registrados en el sistema." /></td>
                    </tr>
                  ) : (
                    tickets.map((t) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <td style={{ padding: '12px 10px', fontWeight: 700, color: '#2563eb' }}>#{t.id}</td>
                        <td style={{ padding: '12px 10px', fontWeight: 600, color: '#1e293b' }}>{t.title}</td>
                        <td style={{ padding: '12px 10px', color: '#475569' }}>{t.area || 'N/A'}</td>
                        <td style={{ padding: '12px 10px' }}><StatusBadge status={t.status} /></td>
                        <td style={{ padding: '12px 10px' }}><PriorityBadge priority={t.priority} /></td>
                        <td style={{ padding: '12px 10px', color: '#475569' }}>
                          {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function KpiCard({ title, count, color, hint, onClick }) {
  return (
    <motion.div 
      whileHover={{ y: -4, boxShadow: '0 6px 16px rgba(2, 62, 138, 0.15)' }}
      onClick={onClick}
      style={{ background: 'var(--card-bg, #ffffff)', padding: '16px 12px 14px', borderRadius: '10px', borderTop: `3px solid ${color}`, borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '120px' }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#4b5563', letterSpacing: '0.5px' }}>{title}</div>
      <div style={{ fontSize: '1.9rem', fontWeight: 800, color: CHART_INK.text, margin: '4px 0 2px', lineHeight: 1.1 }}>{count}</div>
      {hint && <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>{hint}</div>}
      <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600, marginTop: '6px' }}>Ver detalles →</div>
    </motion.div>
  );
}








