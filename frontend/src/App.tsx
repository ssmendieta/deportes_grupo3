import React, { useState } from "react";
import ReservaForm from "./components/reservas/ReservaForm";
import AdminReserva from "./components/reservas/AdminReserva";

const App = () => {
  const [vista, setVista] = useState<"reserva" | "admin">("admin");

  return (
    <div>
      {vista === "reserva" ? (
        <ReservaForm onVolverAdmin={() => setVista("admin")} />
      ) : (
        <AdminReserva onCrearReserva={() => setVista("reserva")} />
      )}
    </div>
  );
};

export default App;
