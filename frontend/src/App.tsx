import { useState } from "react";
import "./App.css";

import AdminReserva from "./components/calendario/reservas/AdminReserva";
import ReservaForm from "./components/calendario/reservas/ReservaForm";
import CalendarioAdminPage from "./pages/CalendarioAdminPage";
import CalendarioEstudiantePage from "./pages/CalendarioEstudiantePage";

type VistaActual =
  | "calendario-admin"
  | "calendario-estudiante"
  | "ver-reservas"
  | "formulario-reserva";

function App() {
  const [vistaActual, setVistaActual] =
    useState<VistaActual>("calendario-admin");

  const estaEnCalendario =
    vistaActual === "calendario-admin" ||
    vistaActual === "calendario-estudiante";

  return (
    <div className="app-principal">
      {estaEnCalendario && (
        <div className="selector-vistas">
          <button
            className={vistaActual === "calendario-admin" ? "activo" : ""}
            onClick={() => setVistaActual("calendario-admin")}
          >
            Admin
          </button>

          <button
            className={vistaActual === "calendario-estudiante" ? "activo" : ""}
            onClick={() => setVistaActual("calendario-estudiante")}
          >
            Estudiante
          </button>
        </div>
      )}

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
