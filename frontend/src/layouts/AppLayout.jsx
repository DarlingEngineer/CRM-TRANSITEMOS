import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './AppLayout.css';

export default function AppLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="app-viewport">
      {/* Sidebar Azul Institucional */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-logo-container">
            <div className="tm-logo-symbol">
              <span className="tm-letters">TM</span>
            </div>
            <div className="brand-text">
              <span className="brand-title">TRÁNSITO DE</span>
              <span className="brand-title">MOSQUERA</span>
              <span className="brand-sub">TRANSITEMOS</span>
            </div>
          </div>
          <div className="brand-divider"></div>
          <div className="brand-badge">TRANSITEMOS • 2026</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">PRINCIPAL</div>
          <Link to="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </Link>

          <div className="nav-section">MÓDULOS</div>
          <Link to="/crear-ticket" className={`nav-item ${isActive('/crear-ticket') ? 'active' : ''}`}>
            <span className="nav-icon">➕</span>
            <span>Generar Ticket</span>
          </Link>
          <Link to="/tickets" className={`nav-item ${isActive('/tickets') ? 'active' : ''}`}>
            <span className="nav-icon">📋</span>
            <span>Estado de Tickets</span>
          </Link>

          <div className="nav-section">ADMINISTRACIÓN</div>
          <div className="nav-item disabled"><span className="nav-icon">📊</span><span>Reportes y KPIs</span></div>
          <div className="nav-item disabled"><span className="nav-icon">👥</span><span>Usuarios</span></div>
          <div className="nav-item disabled"><span className="nav-icon">🔍</span><span>Auditoría</span></div>
          <div className="nav-item disabled"><span className="nav-icon">⚙️</span><span>Configuración</span></div>

          <div className="nav-section">PÚBLICO</div>
          <div className="nav-item disabled"><span className="nav-icon">🌐</span><span>Status Page</span></div>
          <div className="nav-item disabled"><span className="nav-icon">🛠️</span><span>Servicios</span></div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <strong>Administrador</strong>
            <small>Admin • ADMIN</small>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            ✕ Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Container Centrado */}
      <main className="main-content">
        <div className="content-container">
          {children}
        </div>
      </main>
    </div>
  );
}