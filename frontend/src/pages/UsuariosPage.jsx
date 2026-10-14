import React, { useCallback, useEffect, useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import { apiFetch } from '../apiClient';
import { ErrorBanner, Loading } from '../components/Feedback';
import { useToast } from '../context/ToastContext';

export default function UsuariosPage() {
  const { showToast } = useToast() || {};
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', password: '', role: 'solicitante' });
  const [rolesDisponibles, setRolesDisponibles] = useState([]);

  const fetchUsuarios = useCallback(async () => {
    try {
      const res = await apiFetch('/auth/users');
      if (!res.ok) throw new Error('No se pudieron cargar los usuarios.');
      setUsuarios(await res.json());
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
        const res = await apiFetch('/auth/users');
        if (!res.ok) throw new Error('No se pudieron cargar los usuarios.');
        const data = await res.json();
        if (active) { setUsuarios(data); setError(''); }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
      try {
        const res = await apiFetch('/auth/roles');
        if (res.ok) {
          const roles = await res.json();
          if (active) setRolesDisponibles(roles);
        }
      } catch { /* silencio */ }
    })();
    return () => { active = false; };
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) return;
    const res = await apiFetch('/auth/users', { method: 'POST', body: form });
    if (res.ok) {
      showToast?.('Usuario creado');
      setForm({ username: '', password: '', role: 'solicitante' });
      fetchUsuarios();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.detail || 'No se pudo crear el usuario.');
    }
  };

  const handleToggleActivo = async (u) => {
    const accion = u.is_active ? 'deactivate' : 'reactivate';
    if (!window.confirm(`¿${u.is_active ? 'Desactivar' : 'Reactivar'} al usuario "${u.username}"?`)) return;
    const res = await apiFetch(`/auth/users/${u.id}/${accion}`, { method: 'PATCH' });
    if (res.ok) {
      showToast?.(u.is_active ? 'Usuario desactivado' : 'Usuario reactivado');
      fetchUsuarios();
    } else {
      setError('No se pudo actualizar el usuario.');
    }
  };

  const handleCambiarRol = async (u, role) => {
    const res = await apiFetch(`/auth/users/${u.id}/role`, { method: 'PATCH', body: { role } });
    if (res.ok) {
      showToast?.(`Rol de ${u.username} cambiado a ${role}`);
      fetchUsuarios();
    } else {
      setError('No se pudo cambiar el rol.');
    }
  };

  const handleResetPassword = async (u) => {
    const nueva = window.prompt(`Nueva contraseña para "${u.username}":`);
    if (!nueva) return;
    if (nueva.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    const res = await apiFetch(`/auth/users/${u.id}/password`, { method: 'PATCH', body: { password: nueva } });
    if (res.ok) {
      showToast?.(`Contraseña de ${u.username} restablecida`);
    } else {
      setError('No se pudo restablecer la contraseña.');
    }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`¿Eliminar al usuario "${u.username}"?`)) return;
    const res = await apiFetch(`/auth/users/${u.id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast?.('Usuario eliminado');
      fetchUsuarios();
    } else {
      setError('No se pudo eliminar el usuario.');
    }
  };

  return (
    <AppLayout>
      <div style={{ maxWidth: '800px', margin: '20px auto 0', background: '#fff', padding: '28px 32px', borderRadius: '10px', border: '1px solid #e9ecef', borderTop: '4px solid #0d6efd' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0d4b75', marginTop: 0 }}>👥 Gestión de Usuarios</h2>
        <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '-8px', marginBottom: '18px' }}>Administra cuentas, roles y acceso al sistema.</p>
        <ErrorBanner message={error} />

        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            type="text" placeholder="Usuario" value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            style={{ flex: 1, minWidth: '140px', padding: '10px 14px', borderRadius: '6px', border: '1px solid #ced4da' }}
          />
          <input
            type="password" placeholder="Contraseña" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={{ flex: 1, minWidth: '140px', padding: '10px 14px', borderRadius: '6px', border: '1px solid #ced4da' }}
          />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #ced4da' }}>
            {rolesDisponibles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
          </select>
          <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>+ Crear</button>
        </form>

        {loading ? <Loading /> : (
          <div className="table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e9ecef', textAlign: 'left', color: '#495057' }}>
                <th style={{ padding: '10px 8px' }}>#</th>
                <th style={{ padding: '10px 8px' }}>USUARIO</th>
                <th style={{ padding: '10px 8px' }}>ROL</th>
                <th style={{ padding: '10px 8px' }}>ESTADO</th>
                <th style={{ padding: '10px 8px', textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 700, color: '#0d4b75' }}>{u.id}</td>
                  <td style={{ padding: '10px 8px' }}>{u.username}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <select value={u.role} onChange={(e) => handleCambiarRol(u, e.target.value)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.8rem' }}>
                      {rolesDisponibles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{ background: u.is_active ? '#d1e7dd' : '#f8d7da', color: u.is_active ? '#0f5132' : '#842029', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                      {u.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <button onClick={() => handleResetPassword(u)} style={{ background: '#0d4b75', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', marginRight: '6px' }}>
                      🔑 Contraseña
                    </button>
                    <button onClick={() => handleToggleActivo(u)} style={{ background: u.is_active ? '#f87171' : '#34d399', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', marginRight: '6px' }}>
                      {u.is_active ? 'Desactivar' : 'Reactivar'}
                    </button>
                    <button onClick={() => handleDeleteUser(u)} style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                      Eliminar
                    </button>
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







