import { useState } from "react";
import api from "../api";
import "./TicketsPages.css";

export default function GenerarTicketPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Media");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      await api.post("/tickets/", {
        title,
        description,
        priority,
      });

      setMessage("¡Ticket creado con éxito!");
      setTitle("");
      setDescription("");
      setPriority("Media");
    } catch (err) {
      setError("Error al crear el ticket. Revisa los datos o tu sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Generar Nuevo Ticket</h1>
        <p>Completa el formulario para registrar una solicitud de soporte</p>
      </div>

      {message && <div className="form-success">{message}</div>}
      {error && <div className="form-error">{error}</div>}

      <div className="panel">
        <form onSubmit={handleSubmit} className="ticket-form">
          <div className="form-group">
            <label>Título / Asunto</label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Problema con facturación"
              required
            />
          </div>

          <div className="form-group">
            <label>Prioridad</label>
            <select
              className="form-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
            </select>
          </div>

          <div className="form-group">
            <label>Descripción detallada</label>
            <textarea
              className="form-control"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe en detalle la situación..."
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Enviando..." : "Crear Ticket"}
          </button>
        </form>
      </div>
    </div>
  );
}