import { useEffect, useState } from "react";
import api from "../api";
import "./TicketsPages.css";

const STATUS_OPTIONS = ["Abierto", "En Proceso", "Resuelto", "Cerrado"];

function priorityBadgeClass(priority) {
  if (priority === "Alta") return "badge badge-alta";
  if (priority === "Media") return "badge badge-media";
  return "badge badge-baja";
}

function statusBadgeClass(status) {
  if (status === "Abierto") return "badge badge-abierto";
  if (status === "En Proceso") return "badge badge-enproceso";
  if (status === "Resuelto") return "badge badge-resuelto";
  return "badge badge-cerrado";
}

export default function EstadoTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  function loadTickets() {
    setLoading(true);
    setError("");

    api
      .get("/tickets/")
      .then((res) => setTickets(res.data))
      .catch(() => setError("No se pudieron cargar los tickets."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadTickets();
  }, []);

  async function handleStatusChange(ticketId, newStatus) {
    setUpdatingId(ticketId);
    setError("");

    try {
      await api.put("/tickets/" + ticketId, {
        status: newStatus,
      });

      loadTickets();
    } catch (err) {
      setError("No se pudo actualizar el ticket.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Estado de Tickets</h1>
        <p>Consulta y actualiza el estado de cada solicitud</p>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="panel">
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <table className="tickets-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Título</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Creado</th>
                <th>Cambiar estado</th>
              </tr>
            </thead>

            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.title}</td>
                  <td>
                    <span className={priorityBadgeClass(t.priority)}>
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    <span className={statusBadgeClass(t.status)}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <select
                      className="form-select"
                      value={t.status}
                      disabled={updatingId === t.id}
                      onChange={(e) =>
                        handleStatusChange(t.id, e.target.value)
                      }
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}

              {tickets.length === 0 && (
                <tr>
                  <td colSpan={6}>No hay tickets todavía.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}