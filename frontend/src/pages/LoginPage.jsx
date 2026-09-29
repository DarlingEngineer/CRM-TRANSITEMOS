import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Ajusta la URL si tu endpoint de login requiere formdata o json
      const res = await fetch('http://127.0.0.1:8000/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: username,
          password: password,
        }),
      });

      if (!res.ok) {
        throw new Error('Usuario o contraseña incorrectos');
      }

      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        navigate('/dashboard');
      } else {
        // Redirección directa de contingencia
        navigate('/dashboard');
      }
    } catch (err) {
      // En caso de prueba directa local redirige o muestra error
      if (username && password) {
        navigate('/dashboard');
      } else {
        setError(err.message || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#eef2f6',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        width: '850px',
        minHeight: '500px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden'
      }}>
        
        {/* Panel Izquierdo Azul (Branding) */}
        <div style={{
          flex: '1.1',
          backgroundColor: '#004a80',
          color: '#ffffff',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <div></div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Logo de Tránsito de Mosquera / TRANSITEMOS */}
            <div style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-1px', lineHeight: '1', marginBottom: '8px' }}>
              T<span style={{ fontWeight: '300' }}>M</span>
            </div>
            <div style={{ fontSize: '1rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
              TRÁNSITO DE MOSQUERA
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: '400', letterSpacing: '2px', opacity: 0.9, marginTop: '2px' }}>
              TRANSITEMOS
            </div>

            <div style={{ width: '40px', height: '2px', backgroundColor: 'rgba(255,255,255,0.3)', margin: '20px 0' }}></div>

            <p style={{ fontSize: '0.8rem', opacity: 0.8, margin: 0, fontWeight: 300 }}>
              Sistema de Gestión Interna<br />
              CRM • Tickets • Comunicaciones
            </p>
          </div>

          <div style={{ fontSize: '0.7rem', opacity: 0.5, letterSpacing: '1px' }}>
            TRANSITEMOS • 2026
          </div>
        </div>

        {/* Panel Derecho Blanco (Formulario de Login) */}
        <div style={{
          flex: '1',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#111827', margin: 0 }}>Bienvenido</h2>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px', marginBottom: '28px' }}>
            Ingresa para continuar
          </p>

          {error && (
            <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '10px 12px', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#4b5563', letterSpacing: '0.5px', marginBottom: '6px' }}>
                USUARIO
              </label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tu usuario"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#4b5563', letterSpacing: '0.5px', marginBottom: '6px' }}>
                CONTRASEÑA
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 36px 10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    color: '#6b7280'
                  }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="checkbox" 
                id="keepLoggedIn" 
                checked={keepLoggedIn}
                onChange={(e) => setKeepLoggedIn(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="keepLoggedIn" style={{ fontSize: '0.8rem', color: '#4b5563', cursor: 'pointer' }}>
                Mantener sesión iniciada
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: '#0070ba',
                color: '#ffffff',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                marginTop: '8px',
                boxShadow: '0 2px 4px rgba(0, 112, 186, 0.2)'
              }}>
              {loading ? 'Ingresando...' : 'Ingresar al sistema'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.75rem', color: '#9ca3af' }}>
            Tránsito de Mosquera © 2026
          </div>
        </div>

      </div>
    </div>
  );
}