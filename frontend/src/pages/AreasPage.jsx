import React, { useCallback, useEffect, useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import { apiFetch } from '../apiClient';
import { ErrorBanner, Loading } from '../components/Feedback';
import { useToast } from '../context/ToastContext';

export default function AreasPage() {
  const { showToast } = useToast() || {};
  const [areas, setAreas] = useState([]);
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAreas = useCallback(async () => {
    try {
      const res = await apiFetch('/areas/');
      if (!res.ok) throw new Error('No se pudieron cargar las áreas.');
      setAreas(await res.json());
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
        const res = await apiFetch('/areas/');
        if (!res.ok) throw new Error('No se pudieron cargar las áreas.');
        const data = await res.json();
        if (active) { setAreas(data); setError(''); }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    const res = await apiFetch('/areas/', { method: 'POST', body: { name: nombre.trim() } });
    if (res.ok) {
      showToast?.('Área creada');
      setNombre('');
      fetchAreas();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.detail || 'No se pudo crear el área.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar el área "${name}"?`)) return;
    const res = await apiFetch(`/areas/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast?.('Área eliminada');
      fetchAreas();
    } else {
      setError('No se pudo eliminar (puede tener tickets asociados).');
    }
  };

  return (
    <AppLayout>
      <div style={{ maxWidth: '640px', margin: '20px auto 0', background: '#fff', padding: '28px 32px', borderRadius: '10px', border: '1px solid #e9ecef', borderTop: '4px solid #0d6efd' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0d4b75', marginTop: 0 }}>🏢 Gestión de Áreas</h2>
        <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '-8px', marginBottom: '18px' }}>Crea y administra las áreas de la oficina.</p>
        <ErrorBanner message={error} />

        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Nombre de la nueva área"
            value={nombre}
            onChange={(e) => setNombre(e.target.value.toUpperCase())}
            style={{ flex: 1, padding: '10px 14px', borderRadius: '6px', border: '1px solid #ced4da', textTransform: 'uppercase' }}
          />
          <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>+ Crear</button>
        </form>

        {loading ? <Loading /> : (
          <div className="table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e9ecef', textAlign: 'left', color: '#495057' }}>
                <th style={{ padding: '10px 8px' }}>#</th>
                <th style={{ padding: '10px 8px' }}>NOMBRE</th>
                <th style={{ padding: '10px 8px', textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {areas.map((a) => (
                <tr key={a.id} style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 700, color: '#0d4b75' }}>{a.id}</td>
                  <td style={{ padding: '10px 8px' }}>{a.name}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <button onClick={() => handleDelete(a.id, a.name)} style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}







