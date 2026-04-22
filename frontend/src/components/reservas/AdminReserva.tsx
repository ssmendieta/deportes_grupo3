import React, { useState } from "react";
import { jsPDF } from "jspdf";

type Reserva = {
  id: number;
  nombre: string;
  fecha: string;
  hora: string;
  espacio: string;
  carnet: string;
};

type AdminReservaProps = {
  onCrearReserva: () => void;
};

const AdminReserva: React.FC<AdminReservaProps> = ({ onCrearReserva }) => {
  const [reservas, setReservas] = useState<Reserva[]>([
    {
      id: 1,
      nombre: "Juan Perez",
      fecha: "2026-04-25",
      hora: "14:00 - 16:00",
      espacio: "Cancha Arquitectura",
      carnet: "12763669",
    },
    {
      id: 2,
      nombre: "Maria Lopez",
      fecha: "2026-04-26",
      hora: "09:00 - 12:00",
      espacio: "Coliseo",
      carnet: "1345612",
    },
  ]);

  const [seleccionada, setSeleccionada] = useState<Reserva | null>(null);
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroEspacio, setFiltroEspacio] = useState("");

  const generarPDF = (reserva: Reserva) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Universidad Católica Boliviana", 20, 20);

    doc.setFontSize(14);
    doc.text("Dirección de Deportes", 20, 30);

    doc.setFontSize(16);
    doc.text("CARTA DE ACEPTACIÓN DE RESERVA", 20, 50);

    doc.setFontSize(12);
    doc.text(`Estimado/a: ${reserva.nombre}`, 20, 70);

    doc.text(
      "Se le informa que su solicitud de reserva ha sido ACEPTADA con los siguientes detalles:",
      20,
      85,
      { maxWidth: 170 },
    );

    doc.text(`Carrera: ${reserva.carnet}`, 20, 105);
    doc.text(`Espacio: ${reserva.espacio}`, 20, 115);
    doc.text(`Fecha: ${reserva.fecha}`, 20, 125);
    doc.text(`Horario: ${reserva.hora}`, 20, 135);

    doc.text("Atentamente,", 20, 170);
    doc.text("Dirección de Deportes", 20, 180);

    doc.save(`Reserva_${reserva.nombre}.pdf`);
  };

  const aceptarReserva = (reserva: Reserva) => {
    generarPDF(reserva);
    setReservas((prev) => prev.filter((r) => r.id !== reserva.id));
    setSeleccionada(null);
  };

  const cancelarReserva = (id: number) => {
    setReservas((prev) => prev.filter((r) => r.id !== id));
    setSeleccionada(null);
  };

  const reservasFiltradas = reservas.filter((res) => {
    const coincideFecha = filtroFecha ? res.fecha === filtroFecha : true;
    const coincideEspacio = filtroEspacio
      ? res.espacio === filtroEspacio
      : true;
    return coincideFecha && coincideEspacio;
  });

  return (
    <div
      style={{
        backgroundColor: "#f0f2f5",
        minHeight: "100vh",
        padding: "30px",
        fontFamily: "Arial",
      }}
    >
      <div style={{ display: "flex", gap: "30px", marginTop: "40px" }}>
        <div style={{ width: "320px" }}>
          <h3
            style={{
              fontSize: "12px",
              color: "#aaa",
              letterSpacing: "1px",
              marginBottom: "20px",
            }}
          >
            FILTRAR SOLICITUDES
          </h3>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "20px",
              padding: "20px",
              marginBottom: "20px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ marginBottom: "18px" }}>
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: "bold",
                  color: "#999",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                FECHA
              </label>
              <input
                type="date"
                value={filtroFecha}
                onChange={(e) => {
                  setFiltroFecha(e.target.value);
                  setSeleccionada(null);
                }}
                style={{
                  width: "90%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #e0e0e0",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "18px" }}>
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: "bold",
                  color: "#999",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                ESPACIO
              </label>
              <select
                value={filtroEspacio}
                onChange={(e) => {
                  setFiltroEspacio(e.target.value);
                  setSeleccionada(null);
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #e0e0e0",
                  outline: "none",
                }}
              >
                <option value="">Todos</option>
                <option value="Cancha Arquitectura">Cancha Arquitectura</option>
                <option value="Coliseo">Coliseo</option>
              </select>
            </div>

            <button
              onClick={onCrearReserva}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#003366",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              CREAR RESERVA
            </button>
          </div>

          <h3
            style={{
              fontSize: "12px",
              color: "#aaa",
              letterSpacing: "1px",
              marginBottom: "15px",
            }}
          >
            RESERVAS
          </h3>

          {reservasFiltradas.length > 0 ? (
            reservasFiltradas.map((res) => (
              <div
                key={res.id}
                onClick={() => setSeleccionada(res)}
                style={{
                  backgroundColor:
                    seleccionada?.id === res.id ? "#003366" : "white",
                  color: seleccionada?.id === res.id ? "white" : "#333",
                  padding: "20px",
                  borderRadius: "15px",
                  marginBottom: "10px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                }}
              >
                {res.nombre}
              </div>
            ))
          ) : (
            <div
              style={{
                backgroundColor: "white",
                color: "#999",
                padding: "20px",
                borderRadius: "15px",
                textAlign: "center",
              }}
            >
              No hay reservas para ese filtro
            </div>
          )}
        </div>

        <div
          style={{
            flex: 1,
            backgroundColor: "white",
            borderRadius: "30px",
            padding: "50px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
          }}
        >
          {seleccionada ? (
            <div>
              <h2 style={{ color: "#333", margin: 0 }}>
                Información de la Solicitud
              </h2>
              <p
                style={{
                  color: "#0066cc",
                  fontWeight: "bold",
                  fontSize: "14px",
                }}
              >
                UCB - Dirección de Deportes
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "40px",
                  marginTop: "40px",
                }}
              >
                <div>
                  <label
                    style={{
                      color: "#999",
                      fontSize: "11px",
                      fontWeight: "bold",
                    }}
                  >
                    NOMBRE COMPLETO
                  </label>
                  <div style={{ fontSize: "18px", fontWeight: "500" }}>
                    {seleccionada.nombre}
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      color: "#999",
                      fontSize: "11px",
                      fontWeight: "bold",
                    }}
                  >
                    CARNET
                  </label>
                  <div style={{ fontSize: "18px", fontWeight: "500" }}>
                    {seleccionada.carnet}
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      color: "#999",
                      fontSize: "11px",
                      fontWeight: "bold",
                    }}
                  >
                    ESPACIO
                  </label>
                  <div style={{ fontSize: "18px", fontWeight: "500" }}>
                    {seleccionada.espacio}
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      color: "#999",
                      fontSize: "11px",
                      fontWeight: "bold",
                    }}
                  >
                    HORARIO
                  </label>
                  <div style={{ fontSize: "18px", fontWeight: "500" }}>
                    {seleccionada.fecha} | {seleccionada.hora}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "20px", marginTop: "60px" }}>
                <button
                  onClick={() => cancelarReserva(seleccionada.id)}
                  style={{
                    flex: 1,
                    padding: "18px",
                    backgroundColor: "#f5f5f5",
                    color: "#666",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  CANCELAR
                </button>
                <button
                  onClick={() => aceptarReserva(seleccionada)}
                  style={{
                    flex: 1,
                    padding: "18px",
                    backgroundColor: "#003366",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  VER PDF
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{ textAlign: "center", marginTop: "100px", color: "#ccc" }}
            >
              Selecciona una solicitud
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReserva;
