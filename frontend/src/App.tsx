import { useState } from "react";
import "./App.css";

import AdminReserva from "./components/calendario/reservas/AdminReserva";
import ReservaForm from "./components/calendario/reservas/ReservaForm";
import CalendarioAdminPage from "./pages/CalendarioAdminPage";
import CalendarioEstudiantePage from "./pages/CalendarioEstudiantePage";
import DashboardAdminPage from "./pages/DashboardAdminPage"; 
import RegistroDeportistaPage from "./pages/RegistroDeportistaPage";
// --- IMPORTA TU NUEVA PÁGINA DE PAGOS ---
import PagosAcademiasPage from "./pages/PagosAcademiasPage"; 

type VistaActual =
  | "calendario-admin"
  | "calendario-estudiante"
  | "ver-reservas"
  | "formulario-reserva"
  | "dashboard-admin"
  | "registro-deportista"
  | "pagos-academias"; // <-- Agregamos esta vista

function App() {
  const [vistaActual, setVistaActual] =
    useState<VistaActual>("dashboard-admin");

  // Actualizamos para que el menú sea visible también en Pagos
  const estaEnMenuPrincipal =
    vistaActual === "calendario-admin" ||
    vistaActual === "calendario-estudiante" ||
    vistaActual === "dashboard-admin" ||
    vistaActual === "registro-deportista" ||
    vistaActual === "pagos-academias";

  return (
    <div className="app-principal">
      {estaEnMenuPrincipal && (
        <div className="selector-vistas">
          <button
            className={vistaActual === "dashboard-admin" ? "activo" : ""}
            onClick={() => setVistaActual("dashboard-admin")}
          >
            Dashboard
          </button>

          <button
            className={vistaActual === "calendario-admin" ? "activo" : ""}
            onClick={() => setVistaActual("calendario-admin")}
          >
            Calendario
          </button>

          <button
            className={vistaActual === "registro-deportista" ? "activo" : ""}
            onClick={() => setVistaActual("registro-deportista")}
          >
            Deportistas
          </button>

          {/* --- NUEVO BOTÓN DE PAGOS --- */}
          <button
            className={vistaActual === "pagos-academias" ? "activo" : ""}
            onClick={() => setVistaActual("pagos-academias")}
          >
            Pagos
          </button>
        </div>
      )}

      {/* --- VISTA: DASHBOARD --- */}
      {vistaActual === "dashboard-admin" && (
        <DashboardAdminPage 
          onIrARegistro={() => setVistaActual("registro-deportista")} 
        />
      )}

      {/* --- VISTA: REGISTRO DEPORTISTA (Tabla + Formulario) --- */}
      {vistaActual === "registro-deportista" && (
        <RegistroDeportistaPage 
          onVolver={() => setVistaActual("dashboard-admin")} 
        />
      )}

      {/* --- VISTA: VERIFICACIÓN DE PAGOS --- */}
      {vistaActual === "pagos-academias" && (
        <PagosAcademiasPage />
      )}

      {/* --- VISTAS DE CALENDARIO --- */}
      {vistaActual === "calendario-admin" && (
        <CalendarioAdminPage
          onVerReservas={() => setVistaActual("ver-reservas")}
        />
      )}

      {vistaActual === "calendario-estudiante" && <CalendarioEstudiantePage />}

      {vistaActual === "ver-reservas" && (
        <div className="vista-envuelta">
          <div className="barra-vista-unificada">
            <button onClick={() => setVistaActual("calendario-admin")}>
              ← Volver
            </button>
          </div>
          <AdminReserva
            onCrearReserva={() => setVistaActual("formulario-reserva")}
          />
        </div>
      )}

      {vistaActual === "formulario-reserva" && (
        <div className="vista-envuelta">
          <div className="barra-vista-unificada">
            <button onClick={() => setVistaActual("ver-reservas")}>
              ← Volver
            </button>
          </div>
          <ReservaForm onVolverAdmin={() => setVistaActual("ver-reservas")} />
        </div>
      )}
    </div>
  );
}

export default App;