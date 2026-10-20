import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Inbox,
  Clock,
  CheckCircle2,
  Lock,
  Ticket as TicketIcon,
} from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import { apiFetch } from '../apiClient';
import {
  ErrorBanner,
  Loading,
  EmptyState,
  StatusBadge,
  PriorityBadge,
} from '../components/Feedback';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/reportData';

const STATUS_OPTIONS = ['Abierto', 'En proceso', 'Resuelto', 'Cerrado'];
const PRIORITY_OPTIONS = ['Baja', 'Media', 'Alta', 'Urgente'];
const PAGE_SIZE = 10;

const formatDate = (iso) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function EstadoTicketsPage() {
  const { showToast } = useToast() || {};
  const { role } = useAuth() || {};
  const puedeEditar = role === 'admin' || role === 'tecnico';
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await apiFetch('/tickets/?limit=100');
      if (!res.ok) throw new Error('No se pudo conectar con el servidor.');
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
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
        const res = await apiFetch('/tickets/?limit=100');
        if (!res.ok) throw new Error('No se pudo conectar con el servidor.');
        const data = await res.json();
        if (active) {
          setTickets(Array.isArray(data) ? data : []);
          setError('');
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }

      try {
        const res = await apiFetch('/areas/');
        if (res.ok) {
          const data = await res.json();
          if (active) setAreas(Array.isArray(data) ? data : []);
        }
      } catch {
        /* El filtro por área queda vacío si no se pueden cargar. */
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  /**
   * Cambia el estado en la API y refleja el resultado en pantalla.
   * Devuelve true solo si la actualización se completó.
   */
  const handleStatusChange = async (ticket, newStatus) => {
    if (!ticket || newStatus === ticket.status) return false;
    if (!window.confirm(`¿Cambiar el estado del ticket #${ticket.id} a "${newStatus}"?`)) {
      return false;
    }

    setUpdatingId(ticket.id);
    setError('');

    try {
      const res = await apiFetch(`/tickets/${ticket.id}`, {
        method: 'PUT',
        body: { status: newStatus },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || 'No se pudo actualizar el estado.');
      }

      setTickets((prev) => prev.map((item) => (
        item.id === ticket.id ? { ...item, status: newStatus } : item
      )));
      setSelectedTicket((prev) => (
        prev && prev.id === ticket.id ? { ...prev, status: newStatus } : prev
      ));
      showToast?.(`Estado del ticket #${ticket.id} actualizado a "${newStatus}"`);
      return true;
    } catch (err) {
      setError(`No se pudo actualizar el ticket: ${err.message}`);
      showToast?.('Error al actualizar el ticket', 'error');
      return false;
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCloseTicket = async (ticket) => {
    const updated = await handleStatusChange(ticket, 'Cerrado');
    if (updated) setSelectedTicket(null);
  };

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tickets.filter((ticket) => (
      (!filterStatus || ticket.status === filterStatus)
      && (!filterPriority || ticket.priority === filterPriority)
      && (!filterArea || ticket.area === filterArea)
      && (
        !term
        || (ticket.title || '').toLowerCase().includes(term)
        || String(ticket.id).includes(term)
      )
    ));
  }, [tickets, filterStatus, filterPriority, filterArea, search]);

  const suggestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return tickets
      .filter((ticket) => (
        (ticket.title || '').toLowerCase().includes(term)
        || String(ticket.id).includes(term)
      ))
      .slice(0, 6);
  }, [tickets, search]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageTickets = filteredTickets.slice(startIndex, startIndex + PAGE_SIZE);

  const counts = useMemo(() => ({
    total: tickets.length,
    abiertos: tickets.filter((t) => (t.status || '').toLowerCase() === 'abierto').length,
    proceso: tickets.filter((t) => (t.status || '').toLowerCase() === 'en proceso').length,
    resueltos: tickets.filter((t) => ['resuelto', 'cerrado'].includes((t.status || '').toLowerCase())).length,
  }), [tickets]);

  const hasFilters = Boolean(search || filterStatus || filterPriority || filterArea);

  const clearFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterPriority('');
    setFilterArea('');
    setPage(1);
  };

  const applyStatusFilter = (status) => {
    setFilterStatus(status);
    setPage(1);
  };

  return (
    <AppLayout>
      <div className="page page--tickets">
        <PageHeader
          eyebrow="Solicitudes"
          title="Gestión de solicitudes"
          subtitle="Consulta, filtra y actualiza el estado de los tickets registrados en el sistema."
          actions={(
            <>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={fetchTickets}
                disabled={loading}
              >
                <RefreshCw size={16} aria-hidden="true" />
                Actualizar
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => navigate('/generar-ticket')}
              >
                <Plus size={16} aria-hidden="true" />
                Nueva solicitud
              </button>
            </>
          )}
        />

        <ErrorBanner message={error} />

        <div className="tickets-body">
        <div className="stat-grid stat-grid--4">
          <StatCard
            label="Total"
            value={counts.total}
            hint="Solicitudes registradas"
            icon={TicketIcon}
            tone="brand"
            onClick={() => applyStatusFilter('')}
          />
          <StatCard
            label="Abiertas"
            value={counts.abiertos}
            hint="Pendientes de atención"
            icon={Inbox}
            tone="info"
            onClick={() => applyStatusFilter('Abierto')}
          />
          <StatCard
            label="En proceso"
            value={counts.proceso}
            hint="En gestión actualmente"
            icon={Clock}
            tone="warning"
            onClick={() => applyStatusFilter('En proceso')}
          />
          <StatCard
            label="Resueltas / cerradas"
            value={counts.resueltos}
            hint="Atendidas o finalizadas"
            icon={CheckCircle2}
            tone="success"
            onClick={() => applyStatusFilter('Resuelto')}
          />
        </div>

        <section className="card">
          <div className="toolbar">
            <div className="toolbar__search">
              <Search size={16} className="toolbar__search-icon" aria-hidden="true" />
              <input
                type="search"
                className="input"
                placeholder="Buscar por título o número de ticket"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                aria-label="Buscar solicitudes"
              />
              {search && (
                <button
                  type="button"
                  className="toolbar__clear"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  aria-label="Limpiar búsqueda"
                >
                  <X size={14} />
                </button>
              )}

              {search.trim() && (
                <div className="search-suggestions">
                  {suggestions.length === 0 ? (
                    <div className="search-suggestions__empty">Sin coincidencias</div>
                  ) : (
                    suggestions.map((ticket) => (
                      <button
                        type="button"
                        key={ticket.id}
                        className="search-suggestions__item"
                        onClick={() => {
                          setSearch(ticket.title);
                          setPage(1);
                        }}
                      >
                        <span className="search-suggestions__id">#{ticket.id}</span>
                        <span>{ticket.title}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="toolbar__filters">
              <label className="toolbar__field">
                <span>Estado</span>
                <select
                  className="select select--sm"
                  value={filterStatus}
                  onChange={(event) => {
                    setFilterStatus(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Todos</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>

              <label className="toolbar__field">
                <span>Prioridad</span>
                <select
                  className="select select--sm"
                  value={filterPriority}
                  onChange={(event) => {
                    setFilterPriority(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Todas</option>
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </label>

              <label className="toolbar__field">
                <span>Área</span>
                <select
                  className="select select--sm"
                  value={filterArea}
                  onChange={(event) => {
                    setFilterArea(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Todas</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.name}>{area.name}</option>
                  ))}
                </select>
              </label>

              {hasFilters && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={clearFilters}>
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <Loading text="Cargando solicitudes…" />
          ) : (
            <>
              <div className="table-wrap">
                <table className="data-table data-table--tickets">
                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>Solicitud</th>
                      <th>Área</th>
                      <th>Prioridad</th>
                      <th>Estado</th>
                      <th>Creado</th>
                      <th className="col-actions">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageTickets.length === 0 ? (
                      <tr>
                        <td colSpan="7">
                          <EmptyState
                            icon={<Inbox size={22} />}
                            message="No se encontraron solicitudes"
                            hint={hasFilters
                              ? 'Prueba con otros criterios de búsqueda o limpia los filtros.'
                              : 'Aún no hay tickets registrados. Crea la primera solicitud.'}
                          />
                        </td>
                      </tr>
                    ) : (
                      pageTickets.map((ticket) => (
                        <tr
                          key={ticket.id}
                          className="is-clickable"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <td className="cell-id">#{ticket.id}</td>
                          <td>
                            <span className="cell-title" title={ticket.title}>{ticket.title}</span>
                            <span className="cell-sub" title={ticket.body || ''}>
                              {ticket.body || 'Sin descripción'}
                            </span>
                          </td>
                          <td>
                            <span className="chip">{ticket.area || 'Sin área'}</span>
                          </td>
                          <td><PriorityBadge priority={ticket.priority} /></td>
                          <td><StatusBadge status={ticket.status} /></td>
                          <td className="cell-muted">
                            <time dateTime={ticket.created_at || undefined}>
                              {formatDate(ticket.created_at)}
                            </time>
                          </td>
                          <td className="col-actions">
                            <div
                              className="cell-actions"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="btn btn--ghost btn--sm"
                                onClick={() => setSelectedTicket(ticket)}
                                aria-label={`Ver detalle del ticket ${ticket.id}`}
                              >
                                <Eye size={15} aria-hidden="true" />
                                Ver
                              </button>

                              {puedeEditar && (
                                <select
                                  className="select select--xs"
                                  value={ticket.status}
                                  disabled={updatingId === ticket.id}
                                  aria-label={`Cambiar estado del ticket ${ticket.id}`}
                                  onChange={async (event) => {
                                    const nextStatus = event.target.value;
                                    const updated = await handleStatusChange(ticket, nextStatus);
                                    if (!updated) {
                                      // Fuerza el re-render para restaurar el valor controlado.
                                      setTickets((prev) => [...prev]);
                                    }
                                  }}
                                >
                                  {STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>{status}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="table-footer">
                <span className="table-footer__info">
                  {filteredTickets.length === 0
                    ? '0 solicitudes'
                    : `Mostrando ${startIndex + 1}–${Math.min(startIndex + PAGE_SIZE, filteredTickets.length)} de ${filteredTickets.length} solicitudes`}
                </span>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      type="button"
                      className="pagination__btn"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={safePage === 1}
                      aria-label="Página anterior"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="pagination__pages">
                      Página {safePage} de {totalPages}
                    </span>
                    <button
                      type="button"
                      className="pagination__btn"
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      disabled={safePage === totalPages}
                      aria-label="Página siguiente"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
        </div>
      </div>

      <Modal
        open={Boolean(selectedTicket)}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket ? `Ticket #${selectedTicket.id}` : 'Detalle del ticket'}
        subtitle={selectedTicket?.title}
        size="lg"
        footer={selectedTicket ? (
          <div className="modal__actions">
            {puedeEditar && (
              <label className="modal__status">
                Estado
                <select
                  className="select select--sm"
                  value={selectedTicket.status}
                  disabled={updatingId === selectedTicket.id}
                  onChange={async (event) => {
                    const updated = await handleStatusChange(selectedTicket, event.target.value);
                    if (!updated) setSelectedTicket((prev) => (prev ? { ...prev } : prev));
                  }}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
            )}

            {puedeEditar && selectedTicket.status !== 'Cerrado' && (
              <button
                type="button"
                className="btn btn--secondary"
                disabled={updatingId === selectedTicket.id}
                onClick={() => handleCloseTicket(selectedTicket)}
              >
                <Lock size={15} aria-hidden="true" />
                Cerrar ticket
              </button>
            )}

            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setSelectedTicket(null)}
            >
              Volver al listado
            </button>
          </div>
        ) : null}
      >
        {selectedTicket && (
          <TicketDetail
            ticket={selectedTicket}
            puedeEditar={puedeEditar}
          />
        )}
      </Modal>
    </AppLayout>
  );
}

function TicketDetail({ ticket, puedeEditar }) {
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!puedeEditar) return undefined;

    let active = true;
    setLoadingHistory(true);
    setHistoryError('');

    apiFetch(`/tickets/${ticket.id}/history`)
      .then(async (res) => {
        if (!res.ok) throw new Error('No se pudo cargar el historial.');
        const data = await res.json();
        if (active) setHistory(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setHistoryError('No se pudo cargar el historial de cambios.');
      })
      .finally(() => {
        if (active) setLoadingHistory(false);
      });

    return () => {
      active = false;
    };
  }, [ticket.id, puedeEditar]);

  return (
    <div className="ticket-detail">
      <div className="ticket-detail__badges">
        <StatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
        <span className="chip chip--soft">{ticket.area || 'Sin área'}</span>
      </div>

      <div className="detail-grid">
        <div className="detail-item">
          <span className="detail-label">Área responsable</span>
          <span className="detail-value">{ticket.area || 'Sin área'}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Creado</span>
          <span className="detail-value">{formatDateTime(ticket.created_at)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Última actualización</span>
          <span className="detail-value">{formatDateTime(ticket.updated_at)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Actualizado por</span>
          <span className="detail-value">{ticket.updated_by || 'Sin actualizaciones'}</span>
        </div>
      </div>

      <section className="detail-section">
        <h3 className="detail-section__title">Descripción de la solicitud</h3>
        <p className="detail-description">
          {ticket.body || 'Esta solicitud no tiene descripción registrada.'}
        </p>
      </section>

      <section className="detail-section">
        <h3 className="detail-section__title">Historial de cambios</h3>

        {!puedeEditar && (
          <p className="muted-text">
            El historial detallado está disponible para administradores y técnicos.
          </p>
        )}

        {puedeEditar && loadingHistory && <Loading text="Cargando historial…" />}

        {puedeEditar && !loadingHistory && historyError && (
          <p className="muted-text">{historyError}</p>
        )}

        {puedeEditar && !loadingHistory && !historyError && history.length === 0 && (
          <p className="muted-text">No hay cambios de estado registrados.</p>
        )}

        {puedeEditar && !loadingHistory && !historyError && history.length > 0 && (
          <ol className="timeline">
            {history.map((entry) => (
              <li className="timeline__item" key={entry.id}>
                <span className="timeline__dot" aria-hidden="true" />
                <div className="timeline__content">
                  <p className="timeline__title">
                    {entry.old_status ? (
                      <>Estado cambiado de <strong>{entry.old_status}</strong> a <strong>{entry.new_status}</strong></>
                    ) : (
                      <>Solicitud registrada en estado <strong>{entry.new_status}</strong></>
                    )}
                  </p>
                  <p className="timeline__meta">
                    Usuario #{entry.changed_by_id} · {formatDateTime(entry.changed_at)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
