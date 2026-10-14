import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import { apiFetch } from '../apiClient';
import { ErrorBanner } from '../components/Feedback';
import { useToast } from '../context/ToastContext';

export default function GenerarTicketPage() {
  const { showToast } = useToast() || {};
  const navigate = useNavigate();
  const [areas, setAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    priority: 'Alta',
    status: 'Abierto',
    area: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch('/areas/');
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data) && data.length > 0) {
            setAreas(data);
            setFormData(prev => ({ ...prev, area: data[0].name }));
          }
        }
        if (active) setError('');
      } catch (err) {
        if (active) setError('No se pudieron cargar las áreas.');
        console.error("Error al cargar áreas de la API:", err);
      } finally {
        if (active) setLoadingAreas(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.name === 'title' ? e.target.value.toUpperCase() : e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/tickets/', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('No se pudo guardar el ticket. Verifica la conexión con el servidor.');
      }

      showToast('Ticket creado correctamente');
      navigate('/tickets');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Estilos forzados para garantizar fondo blanco en todos los bloques de texto
  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    fontSize: '0.9rem',
    borderRadius: '6px',
    border: '1px solid #ced4da',
    backgroundColor: '#ffffff',
    color: '#212529',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#495057',
    marginBottom: '6px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  };

  return (
    <AppLayout>
      <div style={{ maxWidth: '680px', margin: '20px auto 0', background: 'var(--card-bg, #ffffff)', padding: '30px 36px', borderRadius: '10px', border: '1px solid #e9ecef', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderTop: '4px solid #0d6efd' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0d4b75', margin: 0 }}>
            ➕ Generar Nuevo Ticket
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#6c757d', marginTop: '6px' }}>
            Diligencia la información para aperturar una solicitud formal.
          </p>
        </div>

        <ErrorBanner message={error} />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={labelStyle}>TÍTULO DEL TICKET</label>
            <input 
              type="text" 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              required 
              placeholder="Ej: Requerimiento de acceso" 
              style={{ ...inputStyle, textTransform: 'uppercase' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            <div>
              <label style={labelStyle}>ÁREA</label>
              <select 
                name="area" 
                value={formData.area} 
                onChange={handleChange} 
                disabled={loadingAreas}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                {loadingAreas ? (
                  <option value="">Cargando áreas...</option>
                ) : areas.length === 0 ? (
                  <option value="">Sin áreas disponibles</option>
                ) : (
                  areas.map((u, index) => (
                    <option key={u.id || index} value={u.name}>
                      {u.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label style={labelStyle}>PRIORIDAD</label>
              <select name="priority" value={formData.priority} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>DESCRIPCIÓN</label>
            <textarea 
              name="body" 
              rows="4" 
              value={formData.body} 
              onChange={handleChange} 
              required 
              placeholder="Detalla el problema o requerimiento..." 
              style={{ ...inputStyle, resize: 'vertical' }}
            ></textarea>
          </div>

          {/* Vista previa de lo que se está diligenciando */}
          <div style={{ background: '#f8fafc', border: '1px dashed #94a3b8', borderRadius: '10px', padding: '14px 16px' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Vista previa del ticket</h4>
            <p style={{ margin: '0 0 4px', fontSize: '0.85rem' }}><strong>Título:</strong> {formData.title || '—'}</p>
            <p style={{ margin: '0 0 4px', fontSize: '0.85rem' }}><strong>Área:</strong> {formData.area || '—'} · <strong>Prioridad:</strong> {formData.priority}</p>
            <p style={{ margin: 0, fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}><strong>Descripción:</strong> {formData.body || '—'}</p>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button 
              type="submit" 
              disabled={loading}
              style={{ flex: 1, background: '#2563eb', color: '#ffffff', border: 'none', padding: '11px', borderRadius: '6px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>
              {loading ? 'Guardando...' : 'Guardar Ticket'}
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/tickets')}
              style={{ background: '#e9ecef', color: '#495057', border: 'none', padding: '11px 20px', borderRadius: '6px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}






