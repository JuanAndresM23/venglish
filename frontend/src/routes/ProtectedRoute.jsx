import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

// Protege rutas por sesión, rol ("admin" | "student") y nivel (1 = superadmin).
// Sin `children` actúa como ruta de diseño y renderiza las rutas hijas.
export default function ProtectedRoute({ role, level, children }) {
  const { user } = useAuth();

  if (!user?.is_logged_in) {
    return <Navigate to={role === "admin" ? "/admin-login" : "/login"} replace />;
  }
  if (role && user.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }
  if (level !== undefined && user.level !== level) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ?? <Outlet />;
}
