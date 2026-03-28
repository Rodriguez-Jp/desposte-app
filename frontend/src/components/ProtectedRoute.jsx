import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="main-content empty-state">
      <div className="empty-icon">⏳</div><p>Verificando sesión…</p>
    </div>
  );
  if (!user)                           return <Navigate to="/login" replace />;
  if (adminOnly && user.rol !== "ADMIN") return <Navigate to="/"      replace />;
  return children;
}
