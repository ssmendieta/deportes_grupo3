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
import AppNavigation from "./shared/components/AppNavigation";
import { ErrorBoundary } from "./shared/components/ErrorBoundary";
import DashboardAdminPage from "./features/dashboard/pages/DashboardAdminPage";
import CalendarioPage from "./features/calendario/pages/CalendarioPage";
import RegistroDeportistaPage from "./features/deportistas/pages/RegistroDeportistaPage";
import PagosAcademiasPage from "./features/pagos/pages/PagosAcademiasPage";
import GestionDisciplinasPage from "./features/disciplinas/pages/GestionDisciplinasPage";
import ReservasAdminPage from "./features/reservas/pages/ReservasAdminPage";
import NuevaReservaPage from "./features/reservas/pages/NuevaReservaPage";
import LoginPage from "./features/auth/pages/LoginPage";
import {
  isAuthenticated,
  setToken,
  clearToken,
  getToken,
  getUserFromToken,
} from "./features/auth/authStore";
import { API_URL } from "./shared/services/apiClient";

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

const ADMIN_ROUTES = [
  "/dashboard",
  "/deportistas",
  "/pagos",
  "/disciplinas",
  "/reservas",
  "/reservas/nueva",
];

function ProtectedLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const user = getUserFromToken();

  if (ADMIN_ROUTES.includes(location.pathname) && user?.rol !== "admin") {
    return <Navigate to="/" replace />;
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
        // Si el backend no responde, igual cerramos sesión local
      }
    }
    clearToken();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <div className="app-topbar">
        <AppNavigation />
        <button
          className="btn btn-ghost btn-logout small"
          onClick={handleLogout}
          title="Cerrar sesión"
        >
          {user?.email ? (
            <span className="user-email">{user.email}</span>
          ) : null}
          Salir
        </button>
      </div>
      <main className="app-main">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardAdminPage />} />
          <Route path="/calendario" element={<CalendarioPage />} />
          <Route path="/deportistas" element={<RegistroDeportistaPage />} />
          <Route path="/pagos" element={<PagosAcademiasPage />} />
          <Route path="/disciplinas" element={<GestionDisciplinasPage />} />
          <Route path="/reservas" element={<ReservasAdminPage />} />
          <Route path="/reservas/nueva" element={<NuevaReservaPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
