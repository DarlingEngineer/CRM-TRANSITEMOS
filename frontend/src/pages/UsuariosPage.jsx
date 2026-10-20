import React, { useCallback, useEffect, useState } from 'react';
import { KeyRound, Power, Trash2, UserPlus, Users } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import PageHeader from '../components/PageHeader';
import { apiFetch } from '../apiClient';
import { ErrorBanner, Loading, EmptyState } from '../components/Feedback';
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
        if (active) {
          setUsuarios(Array.isArray(data) ? data : []);
          setError('');
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }

      try {
        const res = await apiFetch('/auth/roles');
        if (res.ok) {
          const roles = await res.json();
          if (active) setRolesDisponibles(Array.isArray(roles) ? roles : []);
        }
      } catch {
        /* El selector conserva las opciones que ya tenga cargadas. */
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.username.trim() || !form.password.trim()) return;

    const res = await apiFetch('/auth/users', { method: 'POST', body: form });
    if (res.ok) {
      showToast?.('Usuario creado correctamente');
      setForm({ username: '', password: '', role: 'solicitante' });
      fetchUsuarios();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.detail || 'No se pudo crear el usuario.');
    }
  };

  const handleToggleActivo = async (user) => {
    const accion = user.is_active ? 'deactivate' : 'reactivate';
    if (!window.confirm(`¿${user.is_active ? 'Desactivar' : 'Reactivar'} al usuario "${user.username}"?`)) return;

    const res = await apiFetch(`/auth/users/${user.id}/${accion}`, { method: 'PATCH' });
    if (res.ok) {
      showToast?.(user.is_active ? 'Usuario desactivado' : 'Usuario reactivado');
      fetchUsuarios();
    } else {
      setError('No se pudo actualizar el estado del usuario.');
    }
  };

  const handleCambiarRol = async (user, role) => {
    const res = await apiFetch(`/auth/users/${user.id}/role`, { method: 'PATCH', body: { role } });
    if (res.ok) {
      showToast?.(`Rol de ${user.username} cambiado a ${role}`);
      fetchUsuarios();
    } else {
      setError('No se pudo cambiar el rol.');
    }
  };

  const handleResetPassword = async (user) => {
    const nueva = window.prompt(
      `Nueva contraseña para "${user.username}" (mínimo 6 caracteres):`,
    );
    if (!nueva) return;
    if (nueva.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const res = await apiFetch(`/auth/users/${user.id}/password`, {
      method: 'PATCH',
      body: { password: nueva },
    });

    if (res.ok) {
      showToast?.(`Contraseña de ${user.username} restablecida`);
    } else {
      setError('No se pudo restablecer la contraseña.');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`¿Eliminar al usuario "${user.username}"?`)) return;
    const res = await apiFetch(`/auth/users/${user.id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast?.('Usuario eliminado');
      fetchUsuarios();
    } else {
      setError('No se pudo eliminar el usuario. Verifica que no tenga tickets asociados.');
    }
  };

  return (
    <AppLayout>
      <div className="page page--users">
        <PageHeader
          eyebrow="Administración"
          title="Usuarios"
          subtitle="Administra las cuentas, los roles y el estado de acceso al sistema."
        />

        <ErrorBanner message={error} />

        <div className="users-body">
        <section className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Nuevo usuario</h2>
              <p className="card__subtitle">
                La contraseña debe tener al menos 6 caracteres.
              </p>
            </div>
          </div>

          <form className="card__body" onSubmit={handleCreate}>
            <div className="form-grid form-grid--4">
              <div className="field">
                <label className="field__label" htmlFor="user-username">
                  Usuario <span className="field__req" aria-hidden="true">*</span>
                </label>
                <input
                  id="user-username"
                  className="input"
                  type="text"
                  placeholder="Nombre de usuario"
                  value={form.username}
                  onChange={(event) => setForm({ ...form, username: event.target.value })}
                  required
                  autoComplete="off"
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="user-password">
                  Contraseña <span className="field__req" aria-hidden="true">*</span>
                </label>
                <input
                  id="user-password"
                  className="input"
                  type="password"
                  placeholder="Contraseña temporal"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="user-role">
                  Rol <span className="field__req" aria-hidden="true">*</span>
                </label>
                <select
                  id="user-role"
                  className="select"
                  value={form.role}
                  onChange={(event) => setForm({ ...form, role: event.target.value })}
                  required
                >
                  {rolesDisponibles.length === 0 && (
                    <option value="solicitante">solicitante</option>
                  )}
                  {rolesDisponibles.map((role) => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>

              <div className="field" style={{ justifyContent: 'flex-end' }}>
                <span className="field__label" aria-hidden="true">&nbsp;</span>
                <button type="submit" className="btn btn--primary btn--block">
                  <UserPlus size={16} aria-hidden="true" />
                  Crear usuario
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Usuarios registrados</h2>
              <p className="card__subtitle">
                {usuarios.length} {usuarios.length === 1 ? 'cuenta registrada' : 'cuentas registradas'}
              </p>
            </div>
            <span className="chip" aria-hidden="true">
              <Users size={14} />
              Cuentas
            </span>
          </div>

          {loading ? (
            <Loading text="Cargando usuarios…" />
          ) : (
            <div className="table-wrap">
              <table className="data-table data-table--users">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th className="col-actions">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.length === 0 ? (
                    <tr>
                      <td colSpan="5">
                        <EmptyState
                          icon={<Users size={22} />}
                          message="No hay usuarios registrados"
                          hint="Crea la primera cuenta para habilitar el acceso al sistema."
                        />
                      </td>
                    </tr>
                  ) : (
                    usuarios.map((user) => (
                      <tr key={user.id}>
                        <td className="cell-id">{user.id}</td>
                        <td>
                          <span className="cell-title" title={user.username}>{user.username}</span>
                        </td>
                        <td>
                          <select
                            className="select select--xs"
                            value={user.role}
                            onChange={(event) => handleCambiarRol(user, event.target.value)}
                            aria-label={`Cambiar rol de ${user.username}`}
                          >
                            {rolesDisponibles.length === 0 && (
                              <option value={user.role}>{user.role}</option>
                            )}
                            {rolesDisponibles.map((role) => (
                              <option key={role.id} value={role.name}>{role.name}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <span className={`badge ${user.is_active ? 'badge--success' : 'badge--muted'}`}>
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="col-actions">
                          <div className="cell-actions">
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              onClick={() => handleResetPassword(user)}
                              title="Restablecer contraseña"
                            >
                              <KeyRound size={14} aria-hidden="true" />
                              Contraseña
                            </button>
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              onClick={() => handleToggleActivo(user)}
                              title={user.is_active ? 'Desactivar usuario' : 'Reactivar usuario'}
                            >
                              <Power size={14} aria-hidden="true" />
                              {user.is_active ? 'Desactivar' : 'Reactivar'}
                            </button>
                            <button
                              type="button"
                              className="btn btn--danger btn--sm"
                              onClick={() => handleDeleteUser(user)}
                              title="Eliminar usuario"
                            >
                              <Trash2 size={14} aria-hidden="true" />
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
        </div>
      </div>
    </AppLayout>
  );
}
