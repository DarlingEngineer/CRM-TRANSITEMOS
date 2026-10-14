import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("access_token"));

  // Al montar (o al cambiar el token), intenta recuperar el usuario actual.
  // apiFetch renueva el token automáticamente si hace falta.
  useEffect(() => {
    if (!token) return;
    let active = true;
    (async () => {
      try {
        const res = await apiFetch("/me");
        if (!res.ok) throw new Error("No autenticado");
        const data = await res.json();
        if (active) setUser(data);
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        if (active) {
          setToken(null);
          setUser(null);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  async function login(username, password) {
    let res;
    try {
      res = await apiFetch("/auth/login", {
        method: "POST",
        body: { username, password },
      });
    } catch {
      throw new Error("No se pudo conectar con el servidor.");
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Usuario o contraseña incorrectos.");
    }
    const data = await res.json();
    localStorage.setItem("access_token", data.access_token);
    if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
    setToken(data.access_token);
    return data;
  }

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setToken(null);
    setUser(null);
  }

  const role = user?.role?.name ?? user?.role ?? null;

  return (
    <AuthContext.Provider value={{ user, token, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
