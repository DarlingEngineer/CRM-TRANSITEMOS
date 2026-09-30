import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
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

    const loginEndpoints = [
      'http://127.0.0.1:8000/auth/login',
      'http://127.0.0.1:8000/token',
      'http://127.0.0.1:8000/login'
    ];

    let authenticated = false;

    for (const url of loginEndpoints) {
      try {
        // Intento 1: Form Data (estándar FastAPI OAuth2)
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        let response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData
        });

        // Intento 2: JSON Body (si el backend no usa OAuth2 standard)
        if (!response.ok && response.status === 422) {
          response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });
        }

        if (response.ok) {
          const data = await response.json();
          const token = data.access_token || data.token || 'login_success_token';
          localStorage.setItem('token', token);
          localStorage.setItem('access_token', token);
          authenticated = true;
          navigate('/dashboard');
          break;
        }
      } catch (err) {
        console.warn('Estrategia fallida para:', url);
      }
    }

    if (!authenticated) {
      setErrorMsg('Usuario o contraseña incorrectos o servidor no disponible.');
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
                <label>USUARIO</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                />
              </div>

              <div className="form-group">
                <label>CONTRASEÑA</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    👁
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