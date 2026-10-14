import React, { useCallback, useEffect, useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import { apiFetch } from '../apiClient';
import { ErrorBanner, Loading } from '../components/Feedback';
import { useToast } from '../context/ToastContext';

export default function RolesPage() {
  const { showToast } = useToast() || {};
  const [roles, setRoles] = useState([]);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRoles = useCallback(async () => {
    try {
      const res = await apiFetch('/auth/roles');
      if (!res.ok) throw new Error('No se pudieron cargar los roles.');
      setRoles(await res.json());
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
        const res = await apiFetch('/auth/roles');
        if (!res.ok) throw new Error('No se pudieron cargar los roles.');
        const data = await res.json();
        if (active) { setRoles(data); setError(''); }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleDelete = async (r) => {
    if (!window.confirm(`¿Eliminar el rol "${r.name}"?`)) return;
    const res = await apiFetch(`/auth/roles/${r.id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast?.('Rol eliminado');
      fetchRoles();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.detail || 'No se pudo eliminar el rol.');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    const res = await apiFetch('/auth/roles', { method: 'POST', body: { name: nombre.trim(), description: descripcion.trim() || null } });
    if (res.ok) {
      showToast?.('Rol creado');
      setNombre('');
      setDescripcion('');
      fetchRoles();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.detail || 'No se pudo crear el rol.');
    }
  };

  return (
    <AppLayout>
      <div style={{ maxWidth: '640px', margin: '20px auto 0', background: '#fff', padding: '28px 32px', borderRadius: '10px', border: '1px solid #e9ecef', borderTop: '4px solid #0d6efd' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0d4b75', marginTop: 0 }}>🛡️ Gestión de Roles</h2>
        <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '-8px', marginBottom: '18px' }}>Roles disponibles y descripción de cada uno.</p>
        <ErrorBanner message={error} />

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text" placeholder="Nombre del rol" value={nombre}
            onChange={(e) => setNombre(e.target.value.toUpperCase())}
            style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #ced4da', textTransform: 'uppercase' }}
          />
          <input
            type="text" placeholder="Descripción (opcional)" value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #ced4da' }}
          />
          <button type="submit" style={{ alignSelf: 'flex-start', background: '#2563eb', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>+ Crear rol</button>
        </form>

        {loading ? <Loading /> : (
          <div className="table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e9ecef', textAlign: 'left', color: '#495057' }}>
                <th style={{ padding: '10px 8px' }}>#</th>
                <th style={{ padding: '10px 8px' }}>NOMBRE</th>
                <th style={{ padding: '10px 8px' }}>DESCRIPCIÓN</th>
                <th style={{ padding: '10px 8px', textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 700, color: '#0d4b75' }}>{r.id}</td>
                  <td style={{ padding: '10px 8px' }}>{r.name}</td>
                  <td style={{ padding: '10px 8px', color: '#6c757d' }}>{r.description || '—'}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <button onClick={() => handleDelete(r)} style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>Eliminar</button>
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







