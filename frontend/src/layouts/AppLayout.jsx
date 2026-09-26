import { Link, Outlet, useNavigate } from "react-router-dom";
import "./AppLayout.css";

export default function AppLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>CRM TRANSITEMOS</h2>
        </div>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-link">
            Dashboard
          </Link>
          <Link to="/generar-ticket" className="nav-link">
            Generar Ticket
          </Link>
          <Link to="/estado-tickets" className="nav-link">
            Estado de Tickets
          </Link>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}