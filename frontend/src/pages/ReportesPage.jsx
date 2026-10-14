import React, { useCallback, useEffect, useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import { apiFetch } from '../apiClient';
import { ErrorBanner, Loading } from '../components/Feedback';
import ChartCard from '../components/ChartCard';
import { buildDetailedCsv, downloadCsv, openPrintableReport } from '../utils/reportExport';
import { Area, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Line, LabelList, ComposedChart } from 'recharts';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function ReportesPage() {
  const [porMes, setPorMes] = useState([]);
  const [porArea, setPorArea] = useState([]);
  const [tiempo, setTiempo] = useState(null);
  const [porPrioridad, setPorPrioridad] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReportes = useCallback(async () => {
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        apiFetch('/metrics/tickets-per-month'),
        apiFetch('/metrics/tickets-per-area'),
        apiFetch('/metrics/response-time'),
        apiFetch('/tickets/?limit=100'),
      ]);
      if (!r1.ok || !r2.ok || !r3.ok) throw new Error('No se pudieron cargar las métricas.');
      setPorMes(await r1.json());
      setPorArea(await r2.json());
      setTiempo(await r3.json());
      if (r4.ok) {
        const data = await r4.json();
        const list = Array.isArray(data) ? data : [];
        setTickets(list);
        const counts = {};
        list.forEach((t) => { counts[t.priority] = (counts[t.priority] || 0) + 1; });
        setPorPrioridad(Object.entries(counts).map(([name, total]) => ({ name, total })));
      }
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
        const [r1, r2, r3, r4] = await Promise.all([
          apiFetch('/metrics/tickets-per-month'),
          apiFetch('/metrics/tickets-per-area'),
          apiFetch('/metrics/response-time'),
          apiFetch('/tickets/?limit=100'),
        ]);
        if (!r1.ok || !r2.ok || !r3.ok) throw new Error('No se pudieron cargar las métricas.');
        const mes = await r1.json();
        const area = await r2.json();
        const t = await r3.json();
        let prioridad = [];
        let list = [];
        if (r4.ok) {
          const data = await r4.json();
          list = Array.isArray(data) ? data : [];
          const counts = {};
          list.forEach((tk) => { counts[tk.priority] = (counts[tk.priority] || 0) + 1; });
          prioridad = Object.entries(counts).map(([name, total]) => ({ name, total }));
        }
        if (active) {
          setPorMes(mes);
          setPorArea(area);
          setTiempo(t);
          setPorPrioridad(prioridad);
          setTickets(list);
          setError('');
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const exportData = { tickets, porMes, porArea, porPrioridad, tiempo };
  const exportCsv = () => downloadCsv(`reporte_tickets_${new Date().toISOString().slice(0, 10)}.csv`, buildDetailedCsv(exportData));
  const exportPdf = () => openPrintableReport(exportData);


  return (
    <AppLayout>
      <div style={{ width: '100%', maxWidth: '1320px', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#5c7cfa', margin: 0 }}>📈 Reportes y KPIs</h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '3px' }}>Métricas generales del sistema de tickets</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={fetchReportes} style={{ background: 'var(--card-bg, #ffffff)', color: '#198754', border: '1.5px solid #198754', padding: '7px 15px', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
              🔄 Actualizar
            </button>
            <button onClick={exportCsv} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
              ⬇️ CSV detallado
            </button>
            <button onClick={exportPdf} style={{ background: '#0b4f78', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
              🖨️ Reporte PDF
            </button>
          </div>
        </div>

        <ErrorBanner message={error} />

        {loading ? (
          <Loading />
        ) : (
          <div className="grid-charts grid-charts--reports">
            {/* TICKETS POR MES */}
            <ChartCard title="Tickets por mes" description="Evolución mensual del volumen de tickets creados en el sistema.">
              {porMes.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Sin datos.</p>
              ) : (
                <ResponsiveContainer width="100%" height={190}>
                  <ComposedChart data={porMes.map(m => ({ name: `${MESES[m.month - 1]} ${m.year}`, total: m.total }))}>
                    <defs>
                      <linearGradient id="colorMes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#555' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#555' }} />
                    <Tooltip formatter={(value) => [`${value} ticket(s)`, 'Creados']} />
                    <Area type="monotone" dataKey="total" stroke="none" fill="url(#colorMes)" />
                    <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} activeDot={{ r: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* TICKETS POR ÁREA */}
            <ChartCard title="Tickets por área" description="Volumen de solicitudes por dependencia, ordenado de mayor a menor.">
              {porArea.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Sin datos.</p>
              ) : (
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={[...porArea].sort((a,b) => b.total - a.total)} layout="vertical" margin={{ left: 60, right: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#555' }} />
                    <YAxis type="category" dataKey="area" tick={{ fontSize: 12, fill: '#555' }} width={90} />
                    <Tooltip formatter={(value) => [`${value} ticket(s)`, 'Total']} />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={16}>
                      {[...porArea].sort((a,b) => b.total - a.total).map((entry, idx) => (
                        <Cell key={entry.area} fill={['#0b4f78', '#1d78c8', '#38bdf8', '#a5d8ff', '#0ea5e9', '#7dd3fc', '#bae6fd', '#e0f2fe'][idx % 8]} />
                      ))}
                      <LabelList dataKey="total" position="right" style={{ fontSize: 11, fill: '#333', fontWeight: 700 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* TICKETS POR PRIORIDAD */}
            <ChartCard title="Tickets por prioridad" description="Reparto de tickets según el nivel de prioridad registrado.">
              {porPrioridad.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Sin datos.</p>
              ) : (
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={porPrioridad} margin={{ top: 16, right: 8, left: -18 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#555' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#555' }} />
                    <Tooltip formatter={(value) => [`${value} ticket(s)`, 'Total']} />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {porPrioridad.map((entry, idx) => (
                        <Cell key={entry.name} fill={['#0b4f78', '#1d78c8', '#38bdf8', '#a5d8ff'][idx % 4]} />
                      ))}
                      <LabelList dataKey="total" position="top" style={{ fontSize: 11, fill: '#333', fontWeight: 700 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* TIEMPO DE RESPUESTA */}
            <ChartCard
              title="Tiempo promedio de resolución"
              description="Promedio de horas invertidas en resolver o cerrar un ticket."
              footer={`${tiempo?.resolved_tickets_count ?? 0} ticket(s) resuelto(s) o cerrado(s)`}
            >
              {(() => {
                const horas = tiempo?.average_hours;
                const pct = horas != null ? Math.min((horas / 24) * 100, 100) : 0;
                return (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: "130px", height: "130px", borderRadius: '50%', background: `conic-gradient(#2563eb ${pct}%, #e2e8f0 ${pct}%)`, display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto' }}>
                      <div style={{ width: '104px', height: '104px', borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb' }}>{horas != null ? `${horas.toFixed(1)}` : 'N/A'}</span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>horas</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </ChartCard>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
















