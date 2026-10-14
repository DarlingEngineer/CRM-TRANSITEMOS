import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, ListChecks, BarChart3, Building2, Users, Shield } from 'lucide-react';
import logoImg from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../apiClient';

export default function AppLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth() || {};
  const [abiertos, setAbiertos] = useState(0);

  useEffect(() => {
    apiFetch('/tickets/?limit=100')
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) setAbiertos(data.filter((t) => (t.status || '').toLowerCase() === 'abierto').length);
      })
      .catch(() => {});
  }, [location.pathname]);

  const handleLogout = () => {
    logout?.();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100%',
      margin: 0,
      padding: 0,
      background: '#f8fafc',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      overflow: 'hidden', // Desactiva scrollbars globales
    }}
      className="app-layout">
      
      {/* BARRA LATERAL AZUL 3D FIJA AL 100% DE ALTURA */}
      <aside style={{
        width: '240px',
        transition: 'width 0.2s ease',
        height: '100vh',
        flexShrink: 0,
        background: 'linear-gradient(180deg, #0b5fa5 0%, #0a4f94 60%, #083d73 100%)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: 'inset -8px 0 20px rgba(0, 0, 0, 0.18)',
        zIndex: 10,
        boxSizing: 'border-box'
      }}>
        <div>
          {/* LOGO INSTITUCIONAL */}
          <div style={{ padding: '20px 16px 16px', textAlign: 'center' }}>
            <img 
              src={logoImg} 
              alt="Tránsito de Mosquera" 
              style={{
                width: '125px',
                height: 'auto',
                display: 'block',
                margin: '0 auto 6px',
                filter: 'brightness(0) invert(1) drop-shadow(0 4px 8px rgba(0,0,0,0.25))'
              }} 
            />
          <div style={{ fontSize: '0.62rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
            TRANSITEMOS • 2026
          </div>
        </div>

        {/* MENÚ NAVEGACIÓN */}
        <nav style={{ padding: '0 12px', fontSize: '0.78rem' }}>
          {/* PRINCIPAL */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', padding: '0 8px 6px', letterSpacing: '0.8px' }}>
                PRINCIPAL
              </div>
              <Link 
                to="/dashboard" 
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 12px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600,
                  color: '#ffffff', background: isActive('/dashboard') ? '#1d78c8' : 'transparent',
                  borderLeft: isActive('/dashboard') ? '3px solid #38bdf8' : '3px solid transparent'
                }}
              >
                <LayoutDashboard size={18} /> Dashboard
              </Link>
            </div>

            {/* MÓDULOS */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', padding: '0 8px 6px', letterSpacing: '0.8px' }}>
                MÓDULOS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <Link 
                  to="/generar-ticket" 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 12px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600,
                    color: isActive('/generar-ticket') ? '#ffffff' : 'rgba(255,255,255,0.8)',
                    background: isActive('/generar-ticket') ? '#1d78c8' : 'transparent',
                    borderLeft: isActive('/generar-ticket') ? '3px solid #38bdf8' : '3px solid transparent'
                  }}
                >
                  <PlusCircle size={18} /> Generar Ticket
                </Link>
                <Link 
                  to="/tickets" 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 12px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600,
                    color: isActive('/tickets') ? '#ffffff' : 'rgba(255,255,255,0.8)',
                    background: isActive('/tickets') ? '#1d78c8' : 'transparent',
                    borderLeft: isActive('/tickets') ? '3px solid #38bdf8' : '3px solid transparent'
                  }}
                >
                  <ListChecks size={18} /> Estado de Tickets {abiertos > 0 && (<span style={{ background: '#dc3545', color: '#fff', borderRadius: '10px', padding: '1px 8px', fontSize: '0.7rem', fontWeight: 800, marginLeft: '6px' }}>{abiertos}</span>)}
                </Link>
              </div>
            </div>

            {/* ADMINISTRACIÓN: solo visible para admin */}
            {role === 'admin' && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', padding: '0 8px 6px', letterSpacing: '0.8px' }}>
                ADMINISTRACIÓN
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <Link to="/reportes" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontWeight: 600 }}><BarChart3 size={16} /> Reportes y KPIs</Link>
                <Link to="/areas" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontWeight: 600 }}><Building2 size={16} /> Áreas</Link>
                <Link to="/usuarios" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontWeight: 600 }}><Users size={16} /> Usuarios</Link>
                <Link to="/roles" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontWeight: 600 }}><Shield size={16} /> Roles</Link>
              </div>
            </div>
            )}

          </nav>
        </div>

        {/* PERFIL INFERIOR */}
        <div style={{ padding: '24px 14px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>{user?.username || 'Usuario'}</div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>{user?.username || ''} • {(role || '').toUpperCase()}</div>
          <div style={{ marginBottom: '8px' }}></div>
          <button 
            onClick={handleLogout}
            style={{ width: '100%', padding: '6px', background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px', color: '#ffffff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
          >
            ✕ Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL CON SCROLL VERTICAL AUTOMÁTICO SOLAMENTE */}
      <main style={{ 
        flex: 1, 
        minWidth: 0, 
        height: '100vh', 
        overflowY: 'auto', 
        overflowX: 'hidden', 
        padding: '20px 24px', 
        boxSizing: 'border-box',
        background: '#f8fafc',
      }}>
        {children}
      </main>

    </div>
  );
}








