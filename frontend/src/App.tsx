import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";
import "./App.css";

import Sidebar from "./shared/components/Sidebar";
import { ErrorBoundary } from "./shared/components/ErrorBoundary";
import { ToastProvider } from "./shared/contexts/ToastContext";
import DashboardAdminPage from "./features/dashboard/pages/DashboardAdminPage";
import CalendarioPage from "./features/calendario/pages/CalendarioPage";
import RegistroDeportistaPage from "./features/deportistas/pages/RegistroDeportistaPage";
import PagosAcademiasPage from "./features/pagos/pages/PagosAcademiasPage";
import GestionDisciplinasPage from "./features/disciplinas/pages/GestionDisciplinasPage";
import AdminReserva from "./features/reservas/components/AdminReserva";
import NuevaReservaPage from "./features/reservas/pages/NuevaReservaPage";
import LoginPage from "./features/auth/pages/LoginPage";
import PerfilPage from "./features/auth/pages/PerfilPage";
import {
  isAuthenticated,
  setToken,
  clearToken,
  getToken,
  getUserFromToken,
} from "./features/auth/authStore";
import { API_URL } from "./shared/services/apiClient";
import { canAccessRoute, getDefaultRouteForRole } from "./config/routes.config";

function captureTokenFromUrl(): void {
  const params = new URLSearchParams(window.location.search);
  let token = params.get("token") ?? params.get("jwt");

  if (!token && window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    token = hashParams.get("token") ?? hashParams.get("jwt");
  }

  if (!token) return;
  setToken(token);
  window.history.replaceState({}, "", window.location.pathname);
}

captureTokenFromUrl();

function RoleBasedRedirect() {
  const user = getUserFromToken();
  const defaultRoute = getDefaultRouteForRole(user?.rol);
  return <Navigate to={defaultRoute} replace />;
}

function ProtectedLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const user = getUserFromToken();

  if (!canAccessRoute(user?.rol, location.pathname)) {
    return <Navigate to={getDefaultRouteForRole(user?.rol)} replace />;
  }

  async function handleLogout() {
    const token = getToken();
    if (token) {
      try {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // cerrar sesión local si backend no responde
      }
    }
    clearToken();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <Sidebar onLogout={handleLogout} />
      <div className="app-content">
        <main className="app-main">
          <ErrorBoundary><Outlet /></ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedLayout />}>
            <Route index element={<RoleBasedRedirect />} />
            <Route path="/dashboard" element={<DashboardAdminPage />} />
            <Route path="/calendario" element={<CalendarioPage />} />
            <Route path="/deportistas" element={<RegistroDeportistaPage />} />
            <Route path="/pagos" element={<PagosAcademiasPage />} />
            <Route path="/disciplinas" element={<GestionDisciplinasPage />} />
            <Route path="/reservas" element={<AdminReserva />} />
            <Route path="/reservas/nueva" element={<NuevaReservaPage />} />
            <Route path="/perfil" element={<PerfilPage />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
