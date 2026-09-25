import React, { useState } from 'react';

export default function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Limpiar mensaje de error individual al escribir
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = 'El usuario o email es requerido.';
    }
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida.';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      // Simulación / llamada a la API
      const response = await fetch('http://127.0.0.1:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          username: formData.username,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        throw new Error('Credenciales inválidas o error en el servidor.');
      }

      const data = await response.json();
      console.log('Inicio de sesión exitoso:', data);
      // Redirección o guardado de token aquí
    } catch (err) {
      setServerError(err.message || 'Ocurrió un error al intentar ingresar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Iniciar Sesión</h2>
        
        {serverError && <div style={styles.serverError}>{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* Campo Usuario / Email */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Usuario / Email</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              style={{
                ...styles.input,
                borderColor: errors.username ? '#ef4444' : '#374151',
              }}
              placeholder="Ingresa tu usuario"
            />
            {errors.username && <span style={styles.errorText}>{errors.username}</span>}
          </div>

          {/* Campo Contraseña */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={{
                ...styles.input,
                borderColor: errors.password ? '#ef4444' : '#374151',
              }}
              placeholder="Ingresa tu contraseña"
            />
            {errors.password && <span style={styles.errorText}>{errors.password}</span>}
          </div>

          {/* Opciones: Recordarme y Olvidé contraseña */}
          <div style={styles.optionsRow}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                style={styles.checkbox}
              />
              Recordarme
            </label>
            <a href="#forgot" style={styles.forgotLink}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {/* Botón con Spinner */}
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? (
              <span style={styles.spinnerContainer}>
                <span style={styles.spinner}></span> Cargando...
              </span>
            ) : (
              'Ingresar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#121212',
    color: '#ffffff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    backgroundColor: '#1e1e1e',
    padding: '2.5rem',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    textAlign: 'center',
    marginBottom: '1.5rem',
    fontSize: '1.5rem',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: '1.2rem',
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '0.875rem',
    marginBottom: '0.4rem',
    color: '#d1d5db',
  },
  input: {
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #374151',
    backgroundColor: '#2d2d2d',
    color: '#ffffff',
    fontSize: '0.95rem',
    outline: 'none',
  },
  errorText: {
    color: '#ef4444',
    fontSize: '0.75rem',
    marginTop: '0.3rem',
  },
  serverError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    border: '1px solid #ef4444',
    padding: '0.6rem',
    borderRadius: '6px',
    fontSize: '0.85rem',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  optionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    fontSize: '0.85rem',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    color: '#9ca3af',
    cursor: 'pointer',
  },
  checkbox: {
    cursor: 'pointer',
  },
  forgotLink: {
    color: '#3b82f6',
    textDecoration: 'none',
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#007bff',
    color: '#ffffff',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  spinnerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #ffffff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.8s linear infinite',
  },
};