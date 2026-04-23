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

  return (
    <div className="app-principal">
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

      {vistaActual === "calendario-admin" && (
        <CalendarioAdminPage
          onVerReservas={() => setVistaActual("ver-reservas")}
        />
      )}

      {vistaActual === "calendario-estudiante" && (
        <CalendarioEstudiantePage
          onReservar={() => setVistaActual("formulario-reserva")}
        />
      )}

      {vistaActual === "ver-reservas" && (
        <div className="vista-envuelta">
          <div className="barra-volver">
            <button onClick={() => setVistaActual("calendario-admin")}>
              ← Volver al calendario admin
            </button>
          </div>

          <AdminReserva
            onCrearReserva={() => setVistaActual("formulario-reserva")}
          />
        </div>
      )}

      {vistaActual === "formulario-reserva" && (
        <div className="vista-envuelta">
          <div className="barra-volver">
            <button onClick={() => setVistaActual("calendario-estudiante")}>
              ← Volver al calendario estudiante
            </button>
          </div>

          <ReservaForm
            onVolverAdmin={() => setVistaActual("calendario-estudiante")}
          />
        </div>
      )}
    </div>
  );
}

export default App;
