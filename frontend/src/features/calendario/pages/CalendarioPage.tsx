import { useState } from "react";
import CalendarioAdminPage from "./CalendarioAdminPage";
import CalendarioEstudiantePage from "./CalendarioEstudiantePage";

type Props = {
  onVerReservas: () => void;
};

function CalendarioPage({ onVerReservas }: Props) {
  const [modo, setModo] = useState<"admin" | "estudiante">("admin");

  return (
    <div className="page-stack">
      <div className="view-toggle-card">
        <button className={modo === "admin" ? "active" : ""} onClick={() => setModo("admin")}>Vista administrador</button>
        <button className={modo === "estudiante" ? "active" : ""} onClick={() => setModo("estudiante")}>Vista estudiante</button>
      </div>

      {modo === "admin" ? <CalendarioAdminPage onVerReservas={onVerReservas} /> : <CalendarioEstudiantePage />}
    </div>
  );
}

export default CalendarioPage;
