import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Info } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import PageHeader from '../components/PageHeader';
import { apiFetch } from '../apiClient';
import { ErrorBanner } from '../components/Feedback';
import { useToast } from '../context/ToastContext';
import { PRIORITY_COLORS } from '../utils/chartTheme';

const PRIORITY_OPTIONS = [
  { value: 'Baja', description: 'Sin impacto inmediato; puede atenderse después.' },
  { value: 'Media', description: 'Afecta una tarea puntual sin bloquear la operación.' },
  { value: 'Alta', description: 'Impide realizar una actividad importante.' },
  { value: 'Urgente', description: 'Riesgo operativo o interrupción crítica del servicio.' },
];

export default function GenerarTicketPage() {
  const { showToast } = useToast() || {};
  const navigate = useNavigate();
  const [areas, setAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    priority: 'Alta',
    status: 'Abierto',
    area: '',
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch('/areas/');
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data) && data.length > 0) {
            setAreas(data);
            setFormData((prev) => ({ ...prev, area: data[0].name }));
          }
        }
        if (active) setError('');
      } catch (err) {
        if (active) setError('No se pudieron cargar las áreas. Verifica la conexión con el servidor.');
        console.error('Error al cargar áreas de la API:', err);
      } finally {
        if (active) setLoadingAreas(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'title' ? value.toUpperCase() : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/tickets/', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.detail || 'No se pudo guardar la solicitud. Verifica la conexión con el servidor.',
        );
      }

      showToast?.('Solicitud creada correctamente');
      navigate('/tickets');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const descriptionLength = formData.body.trim().length;

  return (
    <AppLayout>
      <div className="page page--form page--ticket-form">
        <PageHeader
          eyebrow="Solicitudes"
          title="Nueva solicitud"
          subtitle="Registra el requerimiento con la información necesaria para que el área responsable pueda atenderlo."
          actions={(
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => navigate('/tickets')}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Volver al listado
            </button>
          )}
        />

        <ErrorBanner message={error} />

        <form className="ticket-form" onSubmit={handleSubmit} noValidate={false}>
          <section className="card ticket-form__card">
              <div className="card__header">
                <div>
                  <h2 className="card__title">Información de la solicitud</h2>
                  <p className="card__subtitle">
                    Los campos marcados con <span className="field__req">*</span> son obligatorios.
                  </p>
                </div>
              </div>

              <div className="card__body form-stack">
                <div className="field">
                  <label className="field__label" htmlFor="ticket-title">
                    Título de la solicitud <span className="field__req" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="ticket-title"
                    className="input"
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    autoComplete="off"
                    placeholder="Ej.: Solicitud de acceso al sistema de registro"
                    aria-describedby="ticket-title-help"
                  />
                  <p className="field__help" id="ticket-title-help">
                    Escribe una frase breve que identifique el motivo de la solicitud. Evita
                    incluir detalles que puedan ir en la descripción.
                  </p>
                </div>

                <div className="form-grid form-grid--2">
                  <div className="field">
                    <label className="field__label" htmlFor="ticket-area">
                      Área responsable <span className="field__req" aria-hidden="true">*</span>
                    </label>
                    <select
                      id="ticket-area"
                      className="select"
                      name="area"
                      value={formData.area}
                      onChange={handleChange}
                      disabled={loadingAreas}
                      required
                      aria-describedby="ticket-area-help"
                    >
                      {loadingAreas ? (
                        <option value="">Cargando áreas…</option>
                      ) : areas.length === 0 ? (
                        <option value="">Sin áreas disponibles</option>
                      ) : (
                        areas.map((area) => (
                          <option key={area.id} value={area.name}>
                            {area.name}
                          </option>
                        ))
                      )}
                    </select>
                    <p className="field__help" id="ticket-area-help">
                      Dependencia que revisará y dará trámite al requerimiento.
                    </p>
                  </div>

                  <div className="field">
                    <label className="field__label" htmlFor="ticket-status">
                      Estado inicial
                    </label>
                    <input
                      id="ticket-status"
                      className="input"
                      type="text"
                      value={formData.status}
                      disabled
                      aria-describedby="ticket-status-help"
                    />
                    <p className="field__help" id="ticket-status-help">
                      Toda solicitud nueva ingresa en estado Abierto.
                    </p>
                  </div>
                </div>

                <fieldset className="field priority-field">
                  <legend className="field__label">
                    Prioridad <span className="field__req" aria-hidden="true">*</span>
                  </legend>
                  <div className="priority-grid">
                    {PRIORITY_OPTIONS.map((option) => {
                      const selected = formData.priority === option.value;
                      return (
                        <label
                          key={option.value}
                          className={`priority-option${selected ? ' is-selected' : ''}`}
                        >
                          <input
                            className="priority-option__input"
                            type="radio"
                            name="priority"
                            value={option.value}
                            checked={selected}
                            onChange={handleChange}
                          />
                          <span
                            className="priority-option__dot"
                            style={{ background: PRIORITY_COLORS[option.value] }}
                            aria-hidden="true"
                          />
                          <span className="priority-option__text">
                            <strong>{option.value}</strong>
                            <small>{option.description}</small>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="field__help">
                    Selecciona el nivel que mejor refleje el impacto actual. El área responsable
                    podrá ajustarlo durante la gestión.
                  </p>
                </fieldset>

                <div className="field field--fill">
                  <div className="field__label-row">
                    <label className="field__label" htmlFor="ticket-body">
                      Descripción detallada <span className="field__req" aria-hidden="true">*</span>
                    </label>
                    <span className="field__counter">{descriptionLength} caracteres</span>
                  </div>
                  <textarea
                    id="ticket-body"
                    className="textarea"
                    name="body"
                    rows="6"
                    value={formData.body}
                    onChange={handleChange}
                    required
                    placeholder="Describe qué ocurre, desde cuándo, a quién afecta y qué resultado esperas."
                    aria-describedby="ticket-body-help"
                  />
                  <p className="field__help" id="ticket-body-help">
                    Incluye el contexto necesario para evitar solicitudes de información
                    adicional. No registres contraseñas ni datos sensibles.
                  </p>
                </div>

                {!loadingAreas && areas.length === 0 && (
                  <div className="alert alert--info" role="status">
                    <Info size={16} aria-hidden="true" />
                    <span>
                      No hay áreas configuradas. Solicita a un administrador que registre al
                      menos un área antes de crear la solicitud.
                    </span>
                  </div>
                )}

              </div>

              <div className="card__footer">
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => navigate('/tickets')}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={loading || loadingAreas}
                  >
                    {loading ? (
                      <>
                        <span className="spinner spinner--sm spinner--light" aria-hidden="true" />
                        Creando solicitud…
                      </>
                    ) : (
                      <>
                        <Send size={16} aria-hidden="true" />
                        Crear solicitud
                      </>
                    )}
                  </button>
                </div>
              </div>
          </section>
        </form>
      </div>
    </AppLayout>
  );
}
