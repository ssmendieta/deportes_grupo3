import React, { useState, useEffect } from "react";
import {
  getReservas,
  cancelarReserva,
  getComprobanteUrl,
  type Reserva,
} from "../../../services/reservaService";

type AdminReservaProps = {
  onCrearReserva: () => void;
};

const AdminReserva: React.FC<AdminReservaProps> = ({ onCrearReserva }) => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [seleccionada, setSeleccionada] = useState<Reserva | null>(null);
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroEspacio, setFiltroEspacio] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const params: { fecha?: string; espacioId?: number } = {};
        if (filtroFecha) params.fecha = filtroFecha;
        const data = await getReservas(params);
        setReservas(data);
      } catch {
        setError("Error al cargar reservas");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [filtroFecha, filtroEspacio]);

  const handleCancelar = async (id: number) => {
    try {
      await cancelarReserva(id);
      setSeleccionada(null);
      const data = await getReservas({});
      setReservas(data);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  };

  const handleVerPDF = (id: number) => {
    window.open(getComprobanteUrl(id), "_blank");
  };

  const reservasFiltradas = reservas.filter((res) => {
    const coincideEspacio = filtroEspacio
      ? res.espacio.nombre === filtroEspacio
      : true;
    return coincideEspacio;
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
            FILTRAR RESERVAS
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
                <option value="Cancha de Arquitectura">
                  Cancha de Arquitectura
                </option>
                <option value="Coliseo Polideportivo">
                  Coliseo Polideportivo
                </option>
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
            RESERVAS ({reservasFiltradas.length})
          </h3>

          {error && <p style={{ color: "red", fontSize: "12px" }}>{error}</p>}

          {cargando ? (
            <div
              style={{ color: "#999", textAlign: "center", padding: "20px" }}
            >
              Cargando...
            </div>
          ) : reservasFiltradas.length > 0 ? (
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
                <div>{res.nombre_solicitante}</div>
                <div style={{ fontSize: "12px", opacity: 0.7 }}>
                  {new Date(res.fecha).toLocaleDateString()} | {res.hora_inicio}{" "}
                  - {res.hora_fin}
                </div>
                <div style={{ fontSize: "11px", opacity: 0.6 }}>
                  {res.espacio.nombre}
                </div>
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
              No hay reservas
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
                Información de la Reserva
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
                    {seleccionada.nombre_solicitante}
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
                    {seleccionada.espacio.nombre}
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
                    DISCIPLINA
                  </label>
                  <div style={{ fontSize: "18px", fontWeight: "500" }}>
                    {seleccionada.disciplina.nombre}
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
                    {new Date(seleccionada.fecha).toLocaleDateString()} |{" "}
                    {seleccionada.hora_inicio} - {seleccionada.hora_fin}
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
                    MOTIVO
                  </label>
                  <div style={{ fontSize: "18px", fontWeight: "500" }}>
                    {seleccionada.motivo}
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
                    ESTADO
                  </label>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color:
                        seleccionada.estado === "confirmada" ? "green" : "red",
                    }}
                  >
                    {seleccionada.estado.toUpperCase()}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "20px", marginTop: "60px" }}>
                <button
                  onClick={() => handleCancelar(seleccionada.id)}
                  disabled={seleccionada.estado === "cancelada"}
                  style={{
                    flex: 1,
                    padding: "18px",
                    backgroundColor:
                      seleccionada.estado === "cancelada" ? "#eee" : "#f5f5f5",
                    color: "#666",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: "bold",
                    cursor:
                      seleccionada.estado === "cancelada"
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  CANCELAR RESERVA
                </button>
                <button
                  onClick={() => handleVerPDF(seleccionada.id)}
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
              Selecciona una reserva
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReserva;
