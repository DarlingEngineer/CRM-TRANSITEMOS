import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ErrorBoundary from './components/ErrorBoundary';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const EstadoTicketsPage = lazy(() => import('./pages/EstadoTicketsPage'));
const GenerarTicketPage = lazy(() => import('./pages/GenerarTicketPage'));
const ReportesPage = lazy(() => import('./pages/ReportesPage'));
const AreasPage = lazy(() => import('./pages/AreasPage'));
const UsuariosPage = lazy(() => import('./pages/UsuariosPage'));
const RolesPage = lazy(() => import('./pages/RolesPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function RouteFallback() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>Cargando módulo…</span>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Redirige la raíz '/' directamente al login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route path="/login" element={<LoginPage />} />

            {/* Rutas principales del sistema (protegidas) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Rutas del módulo de tickets */}
              <Route path="/generar-ticket" element={<GenerarTicketPage />} />
              <Route path="/crear-ticket" element={<GenerarTicketPage />} />
              <Route path="/tickets" element={<EstadoTicketsPage />} />
            </Route>

            {/* Rutas exclusivas de admin */}
            <Route element={<AdminRoute />}>
              <Route path="/reportes" element={<ReportesPage />} />
              <Route path="/areas" element={<AreasPage />} />
              <Route path="/usuarios" element={<UsuariosPage />} />
              <Route path="/roles" element={<RolesPage />} />
            </Route>

            {/* Ruta 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
