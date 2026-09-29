import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';

export default function EstadoTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/tickets/', {
        headers: { 
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json'
        }
      });
      if (!res.ok) throw new Error('No se pudo conectar con el servidor.');
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para cambiar el estado enviando actualización completa a la API
  const handleStatusChange = async (ticket, newStatus) => {
    setUpdatingId(ticket.id);
    try {
      const token = localStorage.getItem('token');
      
      // Intentamos primero con PUT / PATCH en el backend
      const res = await fetch(`http://127.0.0.1:8000/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          title: ticket.title,
          body: ticket.body || 'Sin descripción',
          priority: ticket.priority,
          status: newStatus,
          area: ticket.area
        })
      });

      if (!res.ok) {
        // Alternativa con PATCH si PUT no está habilitado
        await fetch(`http://127.0.0.1:8000/tickets/${ticket.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({ status: newStatus })
        });
      }

      // Actualizamos el estado local para reflejar el cambio en tiempo real
      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: newStatus } : t));
    } catch (err) {
      alert('Error al actualizar en la API: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

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
                background: '#007bff', 
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
                background: '#ffffff', 
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

        {error && (
          <div style={{ background: '#f8d7da', color: '#721c24', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.85rem', border: '1px solid #f5c6cb' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Tabla Estilizada con Mismo Diseño del Dashboard */}
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#0d4b75', fontWeight: 600 }}>Cargando información del servidor...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e9ecef', textAlign: 'left', color: '#495057', fontSize: '0.8rem', fontWeight: 700 }}>
                  <th style={{ padding: '12px 8px' }}># ID</th>
                  <th style={{ padding: '12px 8px' }}>TÍTULO</th>
                  <th style={{ padding: '12px 8px' }}>ÁREA</th>
                  <th style={{ padding: '12px 8px' }}>PRIORIDAD</th>
                  <th style={{ padding: '12px 8px' }}>ESTADO ACTUAL</th>
                  <th style={{ padding: '12px 8px' }}>CREADO</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>CAMBIAR ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#6c757d' }}>No se encontraron tickets registrados.</td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f3f5' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 700, color: '#0d4b75' }}>#{t.id}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 600, color: '#212529' }}>{t.title}</td>
                      <td style={{ padding: '12px 8px', color: '#6c757d' }}>{t.area || 'General'}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ 
                          background: t.priority === 'Alta' ? '#dc3545' : t.priority === 'Urgente' ? '#6f42c1' : '#28a745', 
                          color: '#fff', 
                          padding: '4px 10px', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: 600 
                        }}>
                          {t.priority}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ 
                          background: t.status === 'Abierto' ? '#6f42c1' : t.status === 'Resuelto' ? '#28a745' : '#fd7e14', 
                          color: '#fff', 
                          padding: '4px 10px', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: 600 
                        }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', color: '#6c757d' }}>
                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <select 
                          value={t.status} 
                          disabled={updatingId === t.id}
                          onChange={(e) => handleStatusChange(t, e.target.value)}
                          style={{ 
                            padding: '6px 10px', 
                            borderRadius: '6px', 
                            border: '1px solid #ced4da', 
                            fontSize: '0.8rem', 
                            fontWeight: 500,
                            cursor: 'pointer',
                            background: '#f8f9fa'
                          }}>
                          <option value="Abierto">Abierto</option>
                          <option value="En Proceso">En Proceso</option>
                          <option value="Resuelto">Resuelto</option>
                          <option value="Cerrado">Cerrado</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </AppLayout>
  );
}