import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import "./App.css";
import AppNavigation from "./shared/components/AppNavigation";
import DashboardAdminPage from "./features/dashboard/pages/DashboardAdminPage";
import CalendarioPage from "./features/calendario/pages/CalendarioPage";
import RegistroDeportistaPage from "./features/deportistas/pages/RegistroDeportistaPage";
import PagosAcademiasPage from "./features/pagos/pages/PagosAcademiasPage";
import GestionDisciplinasPage from "./features/disciplinas/pages/GestionDisciplinasPage";
import ReservasAdminPage from "./features/reservas/pages/ReservasAdminPage";
import NuevaReservaPage from "./features/reservas/pages/NuevaReservaPage";
import LoginPage from "./features/auth/pages/LoginPage";
import { isAuthenticated, setToken, clearToken, getUserFromToken } from "./features/auth/authStore";

function captureTokenFromUrl(): void {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") ?? params.get("jwt");
  if (!token) return;
  setToken(token);
  params.delete("token");
  params.delete("jwt");
  const newSearch = params.toString();
  const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
  window.history.replaceState({}, "", newUrl);
}

// Capture OAuth token from URL before first render
captureTokenFromUrl();

function ProtectedLayout() {
  const navigate = useNavigate();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const user = getUserFromToken();

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <div className="app-topbar">
        <AppNavigation />
        <button className="btn btn-ghost btn-logout small" onClick={handleLogout} title="Cerrar sesión">
          {user?.email ? <span className="user-email">{user.email}</span> : null}
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
