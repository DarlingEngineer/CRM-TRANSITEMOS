import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  ListChecks,
  BarChart3,
  Building2,
  Users,
  Shield,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../apiClient';

const SECTION_TITLES = {
  '/dashboard': 'Dashboard',
  '/generar-ticket': 'Nueva solicitud',
  '/crear-ticket': 'Nueva solicitud',
  '/tickets': 'Gestión de solicitudes',
  '/reportes': 'Reportes y KPIs',
  '/areas': 'Áreas',
  '/usuarios': 'Usuarios',
  '/roles': 'Roles',
};

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

export default function AppLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth() || {};
  const [abiertos, setAbiertos] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let active = true;
    apiFetch('/tickets/?limit=100')
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        if (active && Array.isArray(data)) {
          setAbiertos(data.filter((t) => (t.status || '').toLowerCase() === 'abierto').length);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarOpen]);

  const navGroups = useMemo(
    () => [
      {
        label: 'Principal',
        items: [
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ],
      },
      {
        label: 'Solicitudes',
        items: [
          { to: '/generar-ticket', label: 'Nueva solicitud', icon: PlusCircle },
          { to: '/tickets', label: 'Gestión de solicitudes', icon: ListChecks, badge: abiertos },
        ],
      },
      ...(role === 'admin'
        ? [
            {
              label: 'Administración',
              items: [
                { to: '/reportes', label: 'Reportes y KPIs', icon: BarChart3 },
                { to: '/areas', label: 'Áreas', icon: Building2 },
                { to: '/usuarios', label: 'Usuarios', icon: Users },
                { to: '/roles', label: 'Roles', icon: Shield },
              ],
            },
          ]
        : []),
    ],
    [role, abiertos],
  );

  const handleLogout = () => {
    logout?.();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const pageTitle = SECTION_TITLES[location.pathname] || 'CRM Transitemos';
  const userName = user?.username || 'Usuario';
  const roleLabel = role || 'usuario';

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Cerrar menú de navegación"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div>
          <div className="sidebar__brand">
            <img src={logoImg} alt="Tránsito de Mosquera" className="sidebar__logo" />
            <span className="sidebar__brand-name">Transitemos</span>
            <span className="sidebar__brand-sub">Gestión de solicitudes</span>
          </div>

          <nav className="sidebar__nav" aria-label="Navegación principal">
            {navGroups.map((group) => (
              <div className="nav-section" key={group.label}>
                <div className="nav-section__label">{group.label}</div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`nav-link${active ? ' is-active' : ''}`}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="nav-link__icon" aria-hidden="true">
                        <Icon size={17} />
                      </span>
                      <span className="nav-link__text">{item.label}</span>
                      {item.badge > 0 && (
                        <span className="nav-link__badge" aria-label={`${item.badge} tickets abiertos`}>
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div className="sidebar__footer">
          <div className="user-card">
            <span className="user-card__avatar" aria-hidden="true">{initials(userName)}</span>
            <div className="user-card__meta">
              <div className="user-card__name">{userName}</div>
              <div className="user-card__role">{roleLabel}</div>
            </div>
          </div>
          <button type="button" className="btn-logout" onClick={handleLogout}>
            <LogOut size={15} aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <button
            type="button"
            className="topbar__menu"
            aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((open) => !open)}
          >
            {sidebarOpen ? <X size={19} /> : <Menu size={19} />}
          </button>

          <div className="topbar__heading">
            <span className="topbar__eyebrow">CRM Transitemos</span>
            <span className="topbar__title">{pageTitle}</span>
          </div>

          <span className="topbar__spacer" />

          <div className="topbar__user">
            <div className="topbar__user-meta">
              <span className="topbar__user-name">{userName}</span>
              <span className="topbar__user-role">{roleLabel}</span>
            </div>
            <button
              type="button"
              className="topbar__logout"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
