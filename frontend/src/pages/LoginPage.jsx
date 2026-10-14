import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err?.message || 'No se pudo conectar con el servidor.');
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Izquierda: Panel Institucional */}
        <div className="login-brand-panel">
          <div className="brand-logo-container">
            <img src={logo} alt="Tránsito de Mosquera Logo" className="brand-logo" />
          </div>
          <div className="brand-info">
            <div className="brand-line"></div>
            <p className="brand-subtitle">
              Sistema de Gestión Interna<br />
              <strong>CRM • Tickets • Comunicaciones</strong>
            </p>
          </div>
          <div className="brand-footer">
            TRANSITEMOS • 2026
          </div>
        </div>

        {/* Derecha: Formulario */}
        <div className="login-form-panel">
          <div className="form-wrapper">
            <h2 className="form-title">Bienvenido</h2>
            <p className="form-subtitle">Ingresa para continuar</p>

            {errorMsg && <div className="error-banner">{errorMsg}</div>}

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="username">USUARIO</label>
                <input
                  id="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">CONTRASEÑA</label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    className={`eye-toggle${showPassword ? ' is-on' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={showPassword}
                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="remember-group">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember">Mantener sesión iniciada</label>
              </div>

              <button type="submit" disabled={loading} className="btn-submit">
                {loading ? 'Ingresando...' : 'Ingresar al sistema'}
              </button>
            </form>
          </div>

          <div className="form-footer">
            Tránsito de Mosquera © 2026
          </div>
        </div>
      </div>
    </div>
  );
}






