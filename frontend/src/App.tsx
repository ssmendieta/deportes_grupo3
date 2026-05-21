// frontend/src/App.tsx

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
} from "react-router-dom";
import "./App.css";

import AppNavigation from "./shared/components/AppNavigation";

import DashboardAdminPage from "./features/dashboard/pages/DashboardAdminPage";
import CalendarioPage from "./features/calendario/pages/CalendarioPage";
import RegistroDeportistaPage from "./features/deportistas/pages/RegistroDeportistaPage";
import PagosAcademiasPage from "./features/pagos/pages/PagosAcademiasPage";
import GestionDisciplinasPage from "./features/disciplinas/pages/GestionDisciplinasPage";

// CORRECCIÓN CRÍTICA: Se quitaron las llaves { } porque tus amigos usaron export default
import AdminReserva from "./features/reservas/components/AdminReserva";
import NuevaReservaPage from "./features/reservas/pages/NuevaReservaPage";

import LoginPage from "./features/auth/pages/LoginPage";

import {
  setToken,
  clearToken,
  getUserFromToken,
} from "./features/auth/authStore";

function captureTokenFromUrl(): void {
  const params = new URLSearchParams(window.location.search);

  const token = params.get("token") ?? params.get("jwt");

  if (!token) return;

  setToken(token);

  params.delete("token");
  params.delete("jwt");

  const newSearch = params.toString();

  const newUrl =
    window.location.pathname + (newSearch ? `?${newSearch}` : "");

  window.history.replaceState({}, "", newUrl);
}

captureTokenFromUrl();

function ProtectedLayout() {
  const navigate = useNavigate();

  // LOGIN DESACTIVADO TEMPORALMENTE PARA DESARROLLO
  // if (!isAuthenticated()) {
  //   return <Navigate to="/login" replace />;
  // }

  const user = getUserFromToken();

  function handleLogout() {
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
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route path="/login" element={<LoginPage />} />

        {/* RUTAS PRINCIPALES */}
        <Route element={<ProtectedLayout />}>

          {/* PAGINA INICIAL */}
          <Route
            index
            element={<Navigate to="/pagos" replace />}
          />

          {/* DASHBOARD */}
          <Route
            path="/dashboard"
            element={<DashboardAdminPage />}
          />

          {/* CALENDARIO */}
          <Route
            path="/calendario"
            element={<CalendarioPage />}
          />

          {/* DEPORTISTAS */}
          <Route
            path="/deportistas"
            element={<RegistroDeportistaPage />}
          />

          {/* PAGOS */}
          <Route
            path="/pagos"
            element={<PagosAcademiasPage />}
          />

          {/* DISCIPLINAS */}
          <Route
            path="/disciplinas"
            element={<GestionDisciplinasPage />}
          />

          {/* RESERVAS */}
          <Route
            path="/reservas"
            element={<AdminReserva />}
          />

          {/* NUEVA RESERVA */}
          <Route
            path="/reservas/nueva"
            element={<NuevaReservaPage />}
          />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;