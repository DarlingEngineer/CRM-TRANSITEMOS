import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute() {
  const { token, role } = useAuth() || {};

  if (!token && !localStorage.getItem("access_token")) {
    return <Navigate to="/login" replace />;
  }

  // Espera a que AuthContext cargue el usuario antes de decidir
  if (token && role === null) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#0b4f78", fontWeight: 600 }}>
        Verificando permisos...
      </div>
    );
  }

  if (role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}






