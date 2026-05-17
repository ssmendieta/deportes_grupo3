import { useState, useEffect } from "react";
import "./App.css";
import AppNavigation from "./shared/components/AppNavigation";
import type { VistaPrincipal } from "./shared/types/navigation.types";
import DashboardAdminPage from "./features/dashboard/pages/DashboardAdminPage";
import CalendarioPage from "./features/calendario/pages/CalendarioPage";
import RegistroDeportistaPage from "./features/deportistas/pages/RegistroDeportistaPage";
import PagosAcademiasPage from "./features/pagos/pages/PagosAcademiasPage";
import GestionDisciplinasPage from "./features/disciplinas/pages/GestionDisciplinasPage";
import ReservasAdminPage from "./features/reservas/pages/ReservasAdminPage";
import NuevaReservaPage from "./features/reservas/pages/NuevaReservaPage";
import LoginPage from "./features/auth/pages/LoginPage";
import { isAuthenticated, setToken, clearToken, getUserFromToken } from "./features/auth/authStore";

type VistaActual = VistaPrincipal | "reservas-admin" | "nueva-reserva";

function vistaPrincipal(vista: VistaActual): VistaPrincipal {
  if (vista === "reservas-admin" || vista === "nueva-reserva") return "calendario";
  return vista;
}

function captureTokenFromUrl(): boolean {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") ?? params.get("jwt");
  if (!token) return false;
  setToken(token);
  params.delete("token");
  params.delete("jwt");
  const newSearch = params.toString();
  const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
  window.history.replaceState({}, "", newUrl);
  return true;
}

function App() {
  const [loggedIn, setLoggedIn] = useState(() => {
    captureTokenFromUrl();
    return isAuthenticated();
  });
  const [vistaActual, setVistaActual] = useState<VistaActual>("dashboard");

  useEffect(() => {
    if (captureTokenFromUrl()) {
      setLoggedIn(true);
    }
  }, []);

  function handleLogout() {
    clearToken();
    setLoggedIn(false);
  }

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />;
  }

  const user = getUserFromToken();

  return (
    <div className="app-shell">
      <div className="app-topbar">
        <AppNavigation vistaActual={vistaPrincipal(vistaActual)} onNavigate={setVistaActual} />
        <button className="btn btn-ghost btn-logout small" onClick={handleLogout} title="Cerrar sesión">
          {user?.email ? <span className="user-email">{user.email}</span> : null}
          Salir
        </button>
      </div>

      <main className="app-main">
        {vistaActual === "dashboard" && <DashboardAdminPage onNavigate={setVistaActual} />}
        {vistaActual === "calendario" && <CalendarioPage onVerReservas={() => setVistaActual("reservas-admin")} />}
        {vistaActual === "deportistas" && <RegistroDeportistaPage />}
        {vistaActual === "pagos" && <PagosAcademiasPage />}
        {vistaActual === "disciplinas" && <GestionDisciplinasPage />}
        {vistaActual === "reservas-admin" && <ReservasAdminPage onVolver={() => setVistaActual("calendario")} onCrearReserva={() => setVistaActual("nueva-reserva")} />}
        {vistaActual === "nueva-reserva" && <NuevaReservaPage onVolver={() => setVistaActual("reservas-admin")} />}
      </main>
    </div>
  );
}

export default App;
