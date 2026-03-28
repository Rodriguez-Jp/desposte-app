import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar         from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage      from "./pages/LoginPage";
import DashboardPage  from "./pages/DashboardPage";
import AnimalesPage   from "./pages/AnimalesPage";
import CortesPage     from "./pages/CortesPage";
import CostosPage     from "./pages/CostosPage";
import SIPSAPage      from "./pages/SIPSAPage";
import AnalisisPage   from "./pages/AnalisisPage";
import UsuariosPage   from "./pages/UsuariosPage";
import PerfilPage     from "./pages/PerfilPage";

function Layout({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <><Navbar />{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/"         element={<Layout><ProtectedRoute><DashboardPage /></ProtectedRoute></Layout>} />
      <Route path="/animales" element={<Layout><ProtectedRoute><AnimalesPage /></ProtectedRoute></Layout>} />
      <Route path="/cortes"   element={<Layout><ProtectedRoute><CortesPage /></ProtectedRoute></Layout>} />
      <Route path="/costos"   element={<Layout><ProtectedRoute><CostosPage /></ProtectedRoute></Layout>} />
      <Route path="/sipsa"    element={<Layout><ProtectedRoute><SIPSAPage /></ProtectedRoute></Layout>} />
      <Route path="/analisis" element={<Layout><ProtectedRoute><AnalisisPage /></ProtectedRoute></Layout>} />
      <Route path="/usuarios" element={<Layout><ProtectedRoute adminOnly><UsuariosPage /></ProtectedRoute></Layout>} />
      <Route path="/perfil"   element={<Layout><ProtectedRoute><PerfilPage /></ProtectedRoute></Layout>} />
      <Route path="*"         element={<Navigate to="/" replace />} />
    </Routes>
  );
}
