import { useEffect, useState } from "react";
import api from "../api";
import "./TicketsPages.css";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total: 0,
    abiertos: 0,
    enProceso: 0,
    resueltos: 0,
    cerrados: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/tickets/")
      .then((res) => {
        const tickets = res.data || [];
        setStats({
          total: tickets.length,
          abiertos: tickets.filter((t) => t.status === "Abierto").length,
          enProceso: tickets.filter((t) => t.status === "En Proceso").length,
          resueltos: tickets.filter((t) => t.status === "Resuelto").length,
          cerrados: tickets.filter((t) => t.status === "Cerrado").length,
        });
      })
      .catch(() => setError("No se pudieron cargar las estadísticas del dashboard."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard General</h1>
        <p>Resumen general del estado del sistema de tickets</p>
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <p>Cargando métricas...</p>
      ) : (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Tickets</h3>
            <p className="stat-number">{stats.total}</p>
          </div>

          <div className="stat-card stat-abierto">
            <h3>Abiertos</h3>
            <p className="stat-number">{stats.abiertos}</p>
          </div>

          <div className="stat-card stat-enproceso">
            <h3>En Proceso</h3>
            <p className="stat-number">{stats.enProceso}</p>
          </div>

          <div className="stat-card stat-resuelto">
            <h3>Resueltos</h3>
            <p className="stat-number">{stats.resueltos}</p>
          </div>

          <div className="stat-card stat-cerrado">
            <h3>Cerrados</h3>
            <p className="stat-number">{stats.cerrados}</p>
          </div>
        </div>
      )}
    </div>
  );
}