import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';

export default function DashboardPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/tickets/', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Error al consultar los tickets del servidor');
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mapeo exacto basado en la respuesta de la API FastAPI
  const totalTickets = tickets.length;
  
  // Conteo por Estados (status)
  const abiertos = tickets.filter(t => (t.status || '').toLowerCase() === 'abierto').length;
  const enProceso = tickets.filter(t => ['en proceso', 'in_progress'].includes((t.status || '').toLowerCase())).length;
  const resueltos = tickets.filter(t => ['resuelto', 'resolved'].includes((t.status || '').toLowerCase())).length;
  const cerrados = tickets.filter(t => ['cerrado', 'closed'].includes((t.status || '').toLowerCase())).length;

  // Conteo por Prioridades (priority)
  const baja = tickets.filter(t => (t.priority || '').toLowerCase() === 'baja').length;
  const media = tickets.filter(t => (t.priority || '').toLowerCase() === 'media').length;
  const alta = tickets.filter(t => (t.priority || '').toLowerCase() === 'alta').length;
  const urgente = tickets.filter(t => (t.priority || '').toLowerCase() === 'urgente').length;

  // Conteo Dinámico por Áreas (area)
  const areasMap = tickets.reduce((acc, t) => {
    const areaName = t.area || 'Sin Área';
    acc[areaName] = (acc[areaName] || 0) + 1;
    return acc;
  }, {});

  return (
    <AppLayout>
      {/* Header Superior */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0d4b75', margin: 0 }}>📊 Dashboard Ejecutivo</h1>
          <p style={{ fontSize: '0.85rem', color: '#6c757d', marginTop: '4px' }}>
            Tránsito de Mosquera 2026 — Panel administrativo completo
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => navigate('/crear-ticket')}
            style={{ background: '#007bff', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,123,255,0.2)' }}>
            + Generar Ticket
          </button>
          <button 
            onClick={fetchTickets}
            style={{ background: '#ffffff', color: '#28a745', border: '1px solid #28a745', padding: '9px 18px', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
            🔄 Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#f8d7da', color: '#721c24', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.85rem', border: '1px solid #f5c6cb' }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#0d4b75', fontWeight: 600 }}>Cargando datos del servidor...</div>
      ) : (
        <>
          {/* Tarjetas KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <KpiCard title="TOTAL TICKETS" count={totalTickets} color="#007bff" onClick={() => navigate('/tickets')} />
            <KpiCard title="ABIERTOS" count={abiertos} color="#6f42c1" onClick={() => navigate('/tickets')} />
            <KpiCard title="EN PROCESO" count={enProceso} color="#fd7e14" onClick={() => navigate('/tickets')} />
            <KpiCard title="RESUELTOS" count={resueltos} color="#28a745" onClick={() => navigate('/tickets')} />
            <KpiCard title="CERRADOS" count={cerrados} color="#6c757d" onClick={() => navigate('/tickets')} />
          </div>

          {/* Gráficos en Fila */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            
            {/* Donut Chart Dinámico */}
            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6c757d', letterSpacing: '0.5px', marginBottom: '16px' }}>POR ESTADO</h3>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '140px' }}>
                <div style={{
                  width: '110px', height: '110px', borderRadius: '50%',
                  background: totalTickets > 0 
                    ? `conic-gradient(#28a745 0% ${(resueltos/totalTickets)*100}%, #6f42c1 ${(resueltos/totalTickets)*100}% 100%)`
                    : '#e9ecef',
                  display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#fff' }}></div>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6c757d', textAlign: 'center', marginTop: '12px' }}>
                <span style={{ color: '#6f42c1', fontWeight: 700 }}>● Abiertos: {abiertos}</span> &nbsp;|&nbsp; 
                <span style={{ color: '#28a745', fontWeight: 700 }}>● Resueltos: {resueltos}</span>
              </div>
            </div>

            {/* Barras por Prioridad Dinámicas */}
            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6c757d', letterSpacing: '0.5px', marginBottom: '16px' }}>POR PRIORIDAD</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', height: '140px', gap: '12px' }}>
                <Bar label="Baja" count={baja} color="#28a745" max={totalTickets} />
                <Bar label="Media" count={media} color="#ffc107" max={totalTickets} />
                <Bar label="Alta" count={alta} color="#dc3545" max={totalTickets} />
                <Bar label="Urgente" count={urgente} color="#6f42c1" max={totalTickets} />
              </div>
            </div>

            {/* Áreas / Departamentos Dinámicos */}
            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6c757d', letterSpacing: '0.5px', marginBottom: '16px' }}>POR DEPARTAMENTO</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '140px', overflowY: 'auto' }}>
                {Object.keys(areasMap).length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: '#6c757d', textAlign: 'center', paddingTop: '20px' }}>Sin áreas registradas</div>
                ) : (
                  Object.entries(areasMap).map(([area, count], idx) => (
                    <div key={idx} style={{ background: '#007bff', color: '#fff', padding: '8px 12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span>{area}</span>
                      <span>{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Tabla de Tickets Recientes */}
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6c757d', letterSpacing: '0.5px', marginBottom: '16px' }}>TICKETS RECIENTES</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e9ecef', textAlign: 'left', color: '#6c757d', fontSize: '0.75rem' }}>
                  <th style={{ padding: '10px 8px' }}># ID</th>
                  <th style={{ padding: '10px 8px' }}>TÍTULO</th>
                  <th style={{ padding: '10px 8px' }}>ÁREA</th>
                  <th style={{ padding: '10px 8px' }}>ESTADO</th>
                  <th style={{ padding: '10px 8px' }}>PRIORIDAD</th>
                  <th style={{ padding: '10px 8px' }}>FECHA CREACIÓN</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>No hay tickets registrados en el sistema.</td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f3f5' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 600, color: '#495057' }}>#{t.id}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 500 }}>{t.title}</td>
                      <td style={{ padding: '12px 8px', color: '#6c757d' }}>{t.area || 'N/A'}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ 
                          background: t.status === 'Abierto' ? '#6f42c1' : t.status === 'Resuelto' ? '#28a745' : '#fd7e14', 
                          color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 
                        }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ 
                          background: t.priority === 'Alta' ? '#dc3545' : t.priority === 'Urgente' ? '#6f42c1' : '#28a745', 
                          color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 
                        }}>
                          {t.priority}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', color: '#6c757d' }}>
                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppLayout>
  );
}

function KpiCard({ title, count, color, onClick }) {
  return (
    <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', borderTop: `4px solid ${color}`, borderLeft: '1px solid #e9ecef', borderRight: '1px solid #e9ecef', borderBottom: '1px solid #e9ecef', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6c757d', letterSpacing: '0.5px' }}>{title}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: color, margin: '6px 0' }}>{count}</div>
      <div onClick={onClick} style={{ fontSize: '0.7rem', color: '#007bff', cursor: 'pointer' }}>Ver detalles →</div>
    </div>
  );
}

function Bar({ label, count, color, max }) {
  const heightPercent = max > 0 ? Math.max((count / max) * 100, 8) : 8;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
      <div style={{ width: '100%', background: color, height: `${heightPercent}%`, borderRadius: '4px 4px 0 0', minHeight: '8px', transition: 'height 0.3s' }}></div>
      <span style={{ fontSize: '0.7rem', color: '#6c757d', marginTop: '6px' }}>{label}</span>
    </div>
  );
}