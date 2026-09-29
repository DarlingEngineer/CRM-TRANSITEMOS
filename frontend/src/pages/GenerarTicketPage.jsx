import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';

export default function GenerarTicketPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    priority: 'Alta',
    status: 'Abierto',
    area: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar únicamente los usuarios reales registrados en la API
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/users/', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
          // Asigna el primer usuario/área obtenido por defecto
          const initialUser = data[0].username || data[0].full_name || data[0].email || data[0].name;
          setFormData(prev => ({ ...prev, area: initialUser }));
        }
      }
    } catch (err) {
      console.error("Error al cargar usuarios de la API:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/tickets/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        throw new Error('No se pudo guardar el ticket. Verifica la conexión con el servidor.');
      }

      navigate('/tickets');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div style={{ maxWidth: '700px', margin: '0 auto', background: '#ffffff', padding: '30px', borderRadius: '8px', border: '1px solid #e9ecef', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0d4b75', marginBottom: '8px' }}>➕ Generar Nuevo Ticket</h2>
        <p style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '24px' }}>Diligencia la información para aperturar una solicitud formal.</p>

        {error && (
          <div style={{ background: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.85rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#495057', marginBottom: '6px' }}>TÍTULO DEL TICKET</label>
            <input 
              type="text" 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              required 
              placeholder="Ej: Requerimiento de acceso" 
              style={{ width: '100%', padding: '10px', fontSize: '0.9rem', border: '1px solid #ced4da', borderRadius: '4px' }} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#495057', marginBottom: '6px' }}>ASIGNAR A (USUARIOS API)</label>
              <select 
                name="area" 
                value={formData.area} 
                onChange={handleChange} 
                disabled={loadingUsers}
                style={{ width: '100%', padding: '10px', fontSize: '0.9rem', border: '1px solid #ced4da', borderRadius: '4px', background: '#fff' }}>
                {loadingUsers ? (
                  <option value="">Cargando usuarios...</option>
                ) : users.length === 0 ? (
                  <option value="General">Sin usuarios en API</option>
                ) : (
                  users.map((u, index) => {
                    const nameDisplay = u.username || u.full_name || u.email || u.name || `Usuario ${u.id || index + 1}`;
                    return (
                      <option key={u.id || index} value={nameDisplay}>
                        {nameDisplay}
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#495057', marginBottom: '6px' }}>PRIORIDAD</label>
              <select name="priority" value={formData.priority} onChange={handleChange} style={{ width: '100%', padding: '10px', fontSize: '0.9rem', border: '1px solid #ced4da', borderRadius: '4px' }}>
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#495057', marginBottom: '6px' }}>DESCRIPCIÓN / CUERPO</label>
            <textarea 
              name="body" 
              rows="4" 
              value={formData.body} 
              onChange={handleChange} 
              required 
              placeholder="Detalla el problema o requerimiento..." 
              style={{ width: '100%', padding: '10px', fontSize: '0.9rem', resize: 'vertical', border: '1px solid #ced4da', borderRadius: '4px' }}
            ></textarea>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button 
              type="submit" 
              disabled={loading}
              style={{ flex: 1, background: '#007bff', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
              {loading ? 'Guardando...' : 'Guardar Ticket'}
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/tickets')}
              style={{ background: '#e9ecef', color: '#495057', border: 'none', padding: '12px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}