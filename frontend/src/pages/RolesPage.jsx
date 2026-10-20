import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Shield, Trash2 } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import PageHeader from '../components/PageHeader';
import { apiFetch } from '../apiClient';
import { ErrorBanner, Loading, EmptyState } from '../components/Feedback';
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
        if (active) {
          setRoles(Array.isArray(data) ? data : []);
          setError('');
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleDelete = async (role) => {
    if (!window.confirm(`¿Eliminar el rol "${role.name}"?`)) return;
    const res = await apiFetch(`/auth/roles/${role.id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast?.('Rol eliminado');
      fetchRoles();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.detail || 'No se pudo eliminar el rol.');
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!nombre.trim()) return;

    const res = await apiFetch('/auth/roles', {
      method: 'POST',
      body: { name: nombre.trim(), description: descripcion.trim() || null },
    });

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
      <div className="page page--form page--split">
        <PageHeader
          eyebrow="Administración"
          title="Roles"
          subtitle="Define los perfiles de acceso disponibles y su descripción dentro del sistema."
        />

        <ErrorBanner message={error} />

        <div className="split-layout">
          <section className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Nuevo rol</h2>
                <p className="card__subtitle">El nombre se registrará en mayúsculas.</p>
              </div>
            </div>

            <form className="card__body form-stack" onSubmit={handleCreate}>
              <div className="field">
                <label className="field__label" htmlFor="role-name">
                  Nombre del rol <span className="field__req" aria-hidden="true">*</span>
                </label>
                <input
                  id="role-name"
                  className="input"
                  type="text"
                  placeholder="Ej.: SUPERVISOR"
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value.toUpperCase())}
                  required
                  autoComplete="off"
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="role-description">
                  Descripción <span className="field__optional">(opcional)</span>
                </label>
                <input
                  id="role-description"
                  className="input"
                  type="text"
                  placeholder="Responsabilidades principales del rol"
                  value={descripcion}
                  onChange={(event) => setDescripcion(event.target.value)}
                />
                <p className="field__help">Ayuda a identificar el alcance del rol.</p>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn--primary">
                  <Plus size={16} aria-hidden="true" />
                  Crear rol
                </button>
              </div>
            </form>
          </section>

          <section className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Roles registrados</h2>
                <p className="card__subtitle">
                  {roles.length} {roles.length === 1 ? 'rol disponible' : 'roles disponibles'}
                </p>
              </div>
              <span className="chip" aria-hidden="true">
                <Shield size={14} />
                Perfiles
              </span>
            </div>

            {loading ? (
              <Loading text="Cargando roles…" />
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Rol</th>
                      <th>Descripción</th>
                      <th className="col-actions">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.length === 0 ? (
                      <tr>
                        <td colSpan="4">
                          <EmptyState
                            icon={<Shield size={22} />}
                            message="No hay roles registrados"
                            hint="Crea el primer rol para organizar los permisos del sistema."
                          />
                        </td>
                      </tr>
                    ) : (
                      roles.map((role) => (
                        <tr key={role.id}>
                          <td className="cell-id">{role.id}</td>
                          <td>
                            <span className="cell-title" title={role.name}>{role.name}</span>
                          </td>
                          <td>
                            <span className="cell-sub" title={role.description || ''}>
                              {role.description || 'Sin descripción'}
                            </span>
                          </td>
                          <td className="col-actions">
                            <div className="cell-actions">
                              <button
                                type="button"
                                className="btn btn--danger btn--sm"
                                onClick={() => handleDelete(role)}
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
