import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import { apiFetch } from '../apiClient';
import { ErrorBanner, Loading, EmptyState, StatusBadge, PriorityBadge } from '../components/Feedback';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function EstadoTicketsPage() {
  const { showToast } = useToast() || {};
  const { role } = useAuth() || {};
  const puedeEditar = role === 'admin' || role === 'tecnico';
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [areas, setAreas] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
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
      try {
        const res = await apiFetch('/areas/');
        if (res.ok) {
          const data = await res.json();
          if (active) setAreas(data);
        }
      } catch { /* silencio */ }
    })();
    return () => { active = false; };
  }, []);

  // Función para cambiar el estado enviando actualización completa a la API
  const handleStatusChange = async (ticket, newStatus) => {
    if (!window.confirm(`¿Cambiar el estado del ticket #${ticket.id} a "${newStatus}"?`)) return;
    setUpdatingId(ticket.id);
    setError('');
    try {
      const res = await apiFetch(`/tickets/${ticket.id}`, {
        method: 'PUT',
        body: { status: newStatus },
      });
      if (!res.ok) throw new Error('No se pudo actualizar el estado.');

      // Actualizamos el estado local para reflejar el cambio en tiempo real
      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: newStatus } : t));
      showToast?.(`Estado del ticket #${ticket.id} actualizado a "${newStatus}"`);
    } catch (err) {
      setError('Error al actualizar en la API: ' + err.message);
      showToast?.('Error al actualizar el ticket', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTickets = tickets.filter(t =>
    (!filterStatus || t.status === filterStatus) &&
    (!filterPriority || t.priority === filterPriority) &&
    (!filterArea || t.area === filterArea) &&
    (!search || t.title.toLowerCase().includes(search.toLowerCase()) || String(t.id).includes(search))
  );
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const pageTickets = filteredTickets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AppLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header Superior */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0d4b75', margin: 0 }}>📌 Estado de Tickets</h1>
            <p style={{ fontSize: '0.85rem', color: '#6c757d', marginTop: '4px' }}>
              Consulta y actualiza el estado de cada solicitud en tiempo real
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button"
              onClick={() => navigate('/generar-ticket')}
              style={{ 
                background: '#2563eb', 
                color: '#ffffff', 
                border: 'none', 
                padding: '10px 20px', 
                borderRadius: '6px', 
                fontWeight: 600, 
                fontSize: '0.85rem', 
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,123,255,0.2)'
              }}>
              + Generar Ticket
            </button>
            <button 
              type="button"
              onClick={fetchTickets}
              style={{ 
                background: 'var(--card-bg, #ffffff)', 
                color: '#28a745', 
                border: '1px solid #28a745', 
                padding: '10px 20px', 
                borderRadius: '6px', 
                fontWeight: 600, 
                fontSize: '0.85rem', 
                cursor: 'pointer' 
              }}>
              🔄 Actualizar
            </button>
          </div>
        </div>

        <ErrorBanner message={error} />

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>BUSCAR</label>
            <input
              type="text"
              placeholder="🔍 Buscar por título o ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.85rem', boxSizing: 'border-box' }}
            />
            {search && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--card-bg, #ffffff)', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: '6px', boxShadow: '0 6px 14px rgba(0,0,0,0.1)', zIndex: 20, maxHeight: '180px', overflowY: 'auto' }}>
                {tickets.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || String(t.id).includes(search)).slice(0, 6).map(t => (
                  <div key={t.id} onClick={() => { setSearch(t.title); setPage(1); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.82rem', borderBottom: '1px solid #f1f5f9', color: '#1e293b' }}>
                    <strong>#{t.id}</strong> {t.title}
                  </div>
                ))}
                {tickets.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || String(t.id).includes(search)).length === 0 && (
                  <div style={{ padding: '8px 12px', fontSize: '0.82rem', color: '#64748b' }}>Sin coincidencias</div>
                )}
              </div>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>ESTADO</label>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.85rem' }}>
              <option value="">Todos los estados</option>
              <option value="Abierto">Abierto</option>
              <option value="En proceso">En proceso</option>
              <option value="Resuelto">Resuelto</option>
              <option value="Cerrado">Cerrado</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>PRIORIDAD</label>
            <select value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.85rem' }}>
              <option value="">Todas las prioridades</option>
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>ÁREA</label>
            <select value={filterArea} onChange={(e) => { setFilterArea(e.target.value); setPage(1); }} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.85rem' }}>
              <option value="">Todas las áreas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla Estilizada con Mismo Diseño del Dashboard */}
        <div style={{ background: 'var(--card-bg, #ffffff)', padding: '20px', borderRadius: '10px', border: '1px solid #e9ecef', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderTop: '4px solid #0d6efd' }}>
          {loading ? (
            <Loading />
          ) : (
            <div className="table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e9ecef', textAlign: 'left', color: '#495057', fontSize: '0.8rem', fontWeight: 700 }}>
                  <th style={{ padding: '12px 8px' }}># ID</th>
                  <th style={{ padding: '12px 8px' }}>TÍTULO</th>
                  <th style={{ padding: '12px 8px' }}>ÁREA</th>
                  <th style={{ padding: '12px 8px' }}>PRIORIDAD</th>
                  <th style={{ padding: '12px 8px' }}>ESTADO ACTUAL</th>
                  <th style={{ padding: '12px 8px' }}>CREADO</th>
                  {puedeEditar && <th style={{ padding: '12px 8px', textAlign: 'center' }}>CAMBIAR ESTADO</th>}
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={puedeEditar ? "7" : "6"}><EmptyState icon="📋" message="No se encontraron tickets registrados." /></td>
                  </tr>
                ) : (
                  pageTickets.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f3f5', cursor: 'pointer' }} onClick={() => setSelectedTicket(t)}>
                      <td style={{ padding: '12px 8px', fontWeight: 700, color: '#0d4b75' }}>#{t.id}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 600, color: '#212529' }}>{t.title}</td>
                      <td style={{ padding: '12px 8px', color: '#6c757d' }}>{t.area || 'Sin área'}</td>
                      <td style={{ padding: '12px 8px' }}><PriorityBadge priority={t.priority} /></td>
                      <td style={{ padding: '12px 8px' }}><StatusBadge status={t.status} /></td>
                      <td style={{ padding: '12px 8px', color: '#6c757d' }}>
                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      {puedeEditar && (
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <select 
                          value={t.status} 
                          disabled={updatingId === t.id}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleStatusChange(t, e.target.value)}
                          style={{ 
                            padding: '8px 12px', 
                            borderRadius: '10px', 
                            border: '1.5px solid #cbd5e1', 
                            fontSize: '0.82rem', 
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: 'var(--card-bg, #ffffff)',
                            minWidth: '140px'
                          }}>
                          <option value="Abierto">Abierto</option>
                          <option value="En proceso">En proceso</option>
                          <option value="Resuelto">Resuelto</option>
                          <option value="Cerrado">Cerrado</option>
                        </select>
                      </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {!loading && totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ced4da', background: '#fff', cursor: 'pointer' }}>← Anterior</button>
              <span style={{ padding: '6px 8px', fontSize: '0.85rem', color: '#495057' }}>Página {page} de {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ced4da', background: '#fff', cursor: 'pointer' }}>Siguiente →</button>
            </div>
          )}
        </div>

      </div>

      {/* Modal de detalle */}
      {selectedTicket && (
        <div onClick={() => setSelectedTicket(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '10px', padding: '28px 32px', maxWidth: '520px', width: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <h2 style={{ marginTop: 0, color: '#0b4f78' }}>Ticket #{selectedTicket.id}</h2>
            <p><strong>Título:</strong> {selectedTicket.title}</p>
            <p><strong>Descripción:</strong> {selectedTicket.body || 'Sin descripción'}</p>
            <p><strong>Área:</strong> {selectedTicket.area || 'Sin área'}</p>
            <p><strong>Prioridad:</strong> {selectedTicket.priority}</p>
            <p><strong>Estado:</strong> {selectedTicket.status}</p>
            <p><strong>Creado:</strong> {selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleString() : 'N/A'}</p>
            <p><strong>Actualizado:</strong> {selectedTicket.updated_at ? new Date(selectedTicket.updated_at).toLocaleString() : 'N/A'}</p>
            {selectedTicket.updated_by && (
              <p><strong>Actualizado por:</strong> {selectedTicket.updated_by}</p>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button onClick={() => setSelectedTicket(null)} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Cerrar</button>
              {puedeEditar && selectedTicket.status !== 'Cerrado' && (
                <button
                  onClick={() => {
                    handleStatusChange(selectedTicket, 'Cerrado');
                    setSelectedTicket(null);
                  }}
                  style={{ background: '#64748b', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                >
                  🔒 Cerrar ticket
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}





