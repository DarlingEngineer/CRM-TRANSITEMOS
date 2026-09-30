import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EstadoTicketsPage from './pages/EstadoTicketsPage';
import GenerarTicketPage from './pages/GenerarTicketPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirige la raíz '/' directamente al login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Tu pantalla de login original intacta */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Rutas principales del sistema */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tickets" element={<EstadoTicketsPage />} />
        
        {/* Rutas del módulo de tickets */}
        <Route path="/generar-ticket" element={<GenerarTicketPage />} />
        <Route path="/crear-ticket" element={<GenerarTicketPage />} />

        {/* Cualquier ruta desconocida redirige al login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}