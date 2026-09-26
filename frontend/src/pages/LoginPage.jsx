import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";
import "./LoginPage.css";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError("Usuario o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-side">
          <img src={logo} alt="Tránsito de Mosquera - Transitemos" className="login-side-logo" />
          <div className="login-side-divider" />
          <p className="login-side-text">
            Sistema de Gestión Interna
            <br />
            CRM • Tickets • Comunicaciones
          </p>
          <span className="login-side-footer">Transitemos • 2026</span>
        </div>

        <div className="login-form-side">
          <h1 className="login-title">Bienvenido</h1>
          <p className="login-subtitle">Ingresa para continuar</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="login-label" htmlFor="username">Usuario</label>
              <input
                id="username"
                className="login-input"
                type="text"
                placeholder="Tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="password">Contraseña</label>
              <div className="login-input-wrap">
                <input
                  id="password"
                  className="login-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-eye-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="login-row">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Mantener sesión iniciada
              </label>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar al sistema"}
            </button>
          </form>

          <p className="login-footer-text">Transito de Mosquera © 2026</p>
        </div>
      </div>
    </div>
  );
}