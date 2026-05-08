import { useState } from "react";
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

type VistaActual = VistaPrincipal | "reservas-admin" | "nueva-reserva";

function vistaPrincipal(vista: VistaActual): VistaPrincipal {
  if (vista === "reservas-admin" || vista === "nueva-reserva") return "calendario";
  return vista;
}

function App() {
  const [vistaActual, setVistaActual] = useState<VistaActual>("dashboard");

  return (
    <div className="app-shell">
      <AppNavigation vistaActual={vistaPrincipal(vistaActual)} onNavigate={setVistaActual} />

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
