import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Plus, Trash2 } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import PageHeader from '../components/PageHeader';
import { apiFetch } from '../apiClient';
import { ErrorBanner, Loading, EmptyState } from '../components/Feedback';
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
        if (active) {
          setAreas(Array.isArray(data) ? data : []);
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

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!nombre.trim()) return;

    const res = await apiFetch('/areas/', { method: 'POST', body: { name: nombre.trim() } });
    if (res.ok) {
      showToast?.('Área creada correctamente');
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
      setError('No se pudo eliminar el área. Verifica que no tenga tickets asociados.');
    }
  };

  return (
    <AppLayout>
      <div className="page page--form page--split">
        <PageHeader
          eyebrow="Administración"
          title="Áreas"
          subtitle="Registra y administra las dependencias que atienden las solicitudes del sistema."
        />

        <ErrorBanner message={error} />

        <div className="split-layout">
          <section className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Nueva área</h2>
                <p className="card__subtitle">El nombre se registrará en mayúsculas.</p>
              </div>
            </div>

            <form className="card__body form-stack" onSubmit={handleCreate}>
              <div className="field">
                <label className="field__label" htmlFor="area-name">
                  Nombre del área <span className="field__req" aria-hidden="true">*</span>
                </label>
                <input
                  id="area-name"
                  className="input"
                  type="text"
                  placeholder="Ej.: Registro Automotor"
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value.toUpperCase())}
                  required
                  autoComplete="off"
                />
                <p className="field__help">Usa el nombre oficial de la dependencia.</p>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn--primary">
                  <Plus size={16} aria-hidden="true" />
                  Crear área
                </button>
              </div>
            </form>
          </section>

          <section className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Áreas registradas</h2>
                <p className="card__subtitle">
                  {areas.length} {areas.length === 1 ? 'área disponible' : 'áreas disponibles'}
                </p>
              </div>
              <span className="chip" aria-hidden="true">
                <Building2 size={14} />
                Catálogo
              </span>
            </div>

            {loading ? (
              <Loading text="Cargando áreas…" />
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Área</th>
                      <th className="col-actions">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {areas.length === 0 ? (
                      <tr>
                        <td colSpan="3">
                          <EmptyState
                            icon={<Building2 size={22} />}
                            message="No hay áreas registradas"
                            hint="Crea la primera área para poder asignar solicitudes."
                          />
                        </td>
                      </tr>
                    ) : (
                      areas.map((area) => (
                        <tr key={area.id}>
                          <td className="cell-id">{area.id}</td>
                          <td>
                            <span className="cell-title" title={area.name}>{area.name}</span>
                          </td>
                          <td className="col-actions">
                            <div className="cell-actions">
                              <button
                                type="button"
                                className="btn btn--danger btn--sm"
                                onClick={() => handleDelete(area.id, area.name)}
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
