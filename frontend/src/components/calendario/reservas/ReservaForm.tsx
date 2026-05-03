import React, { useState, useEffect } from "react";
import {
  getEspacios,
  getDisciplinas,
  crearReserva,
  type Espacio,
  type Disciplina,
} from "../../../services/reservaService";

type ReservaFormProps = {
  onVolverAdmin: () => void;
};

const ReservaForm: React.FC<ReservaFormProps> = ({ onVolverAdmin }) => {
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    carnet: "",
    motivo: "",
    espacio_id: "",
    disciplina_id: "",
    dia: "",
    horaInicio: "",
    horaFinal: "",
  });

  useEffect(() => {
    const cargarDatos = async () => {
      const [esp, disc] = await Promise.all([getEspacios(), getDisciplinas()]);
      setEspacios(esp);
      setDisciplinas(disc);
      if (esp.length > 0)
        setFormData((prev) => ({ ...prev, espacio_id: String(esp[0].id) }));
      if (disc.length > 0)
        setFormData((prev) => ({ ...prev, disciplina_id: String(disc[0].id) }));
    };
    cargarDatos();
  }, []);

  const calcularHoras = () => {
    if (!formData.horaInicio || !formData.horaFinal) return 0;
    const inicio = new Date(`2026-01-01T${formData.horaInicio}`);
    const fin = new Date(`2026-01-01T${formData.horaFinal}`);
    const diff = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);
    return diff > 0 ? diff : 0;
  };

  const horas = calcularHoras();

  const botonBloqueado =
    !formData.nombre ||
    !formData.carnet ||
    !formData.motivo ||
    !formData.dia ||
    !formData.espacio_id ||
    !formData.disciplina_id ||
    horas <= 0 ||
    horas > 3;

  const handleSubmit = async () => {
    setError("");
    setCargando(true);
    try {
      await crearReserva({
        espacio_id: parseInt(formData.espacio_id),
        disciplina_id: parseInt(formData.disciplina_id),
        fecha: formData.dia,
        hora_inicio: formData.horaInicio,
        hora_fin: formData.horaFinal,
        motivo: formData.motivo,
        nombre_solicitante: formData.nombre,
        carnet: formData.carnet,
      });
      setExito(true);
      setTimeout(() => onVolverAdmin(), 2000);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Error al crear la reserva");
      }
    }
  };

  if (exito) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "100px",
          fontFamily: "Segoe UI",
        }}
      >
        <h2 style={{ color: "green" }}>✅ Reserva creada exitosamente</h2>
        <p style={{ color: "#666" }}>Redirigiendo...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#f4f7f6",
        minHeight: "100vh",
        padding: "20px",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "40px",
          padding: "0 20px",
        }}
      >
        <img
          src="https://lpz.ucb.edu.bo/wp-content/uploads/2021/08/logo-UCB-horizontal.png"
          alt="UCB"
          style={{ height: "50px" }}
        />
        {/*
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: "bold", color: "#003366" }}>
              Don Víctor Hugo Nina
            </div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              Administrador - Deportes
            </div>
          </div>
          <div
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "#003366",
              color: "white",
              borderRadius: "50%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontWeight: "bold",
            }}
          >
            VN
          </div>
        </div>
        */}
      </div>

      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          backgroundColor: "white",
          padding: "40px",
          borderRadius: "25px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h2
          style={{ textAlign: "center", color: "#003366", marginBottom: "5px" }}
        >
          Nueva Reserva
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "#aaa",
            fontSize: "14px",
            marginBottom: "30px",
          }}
        >
          UCB - Dirección de Deportes
        </p>

        {error && (
          <div
            style={{
              backgroundColor: "#fff0f0",
              border: "1px solid #ffcccc",
              borderRadius: "10px",
              padding: "12px",
              marginBottom: "20px",
              color: "red",
              fontSize: "13px",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              fontSize: "11px",
              fontWeight: "bold",
              color: "#999",
              display: "block",
              marginBottom: "8px",
            }}
          >
            NOMBRE DEL SOLICITANTE
          </label>
          <input
            type="text"
            placeholder="Ej. Juan Pérez"
            value={formData.nombre}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #e0e0e0",
              outline: "none",
              boxSizing: "border-box",
            }}
            onChange={(e) =>
              setFormData({ ...formData, nombre: e.target.value })
            }
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              fontSize: "11px",
              fontWeight: "bold",
              color: "#999",
              display: "block",
              marginBottom: "8px",
            }}
          >
            CARNET
          </label>
          <input
            type="text"
            placeholder="Ej. 12345678"
            value={formData.carnet}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #e0e0e0",
              outline: "none",
              boxSizing: "border-box",
            }}
            onChange={(e) =>
              setFormData({ ...formData, carnet: e.target.value })
            }
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              fontSize: "11px",
              fontWeight: "bold",
              color: "#999",
              display: "block",
              marginBottom: "8px",
            }}
          >
            MOTIVO
          </label>
          <input
            type="text"
            placeholder="Ej. Práctica de Fútsal"
            value={formData.motivo}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #e0e0e0",
              outline: "none",
              boxSizing: "border-box",
            }}
            onChange={(e) =>
              setFormData({ ...formData, motivo: e.target.value })
            }
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <div>
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
              value={formData.espacio_id}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #e0e0e0",
                boxSizing: "border-box",
              }}
              onChange={(e) =>
                setFormData({ ...formData, espacio_id: e.target.value })
              }
            >
              {espacios.map((esp) => (
                <option key={esp.id} value={esp.id}>
                  {esp.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                fontSize: "11px",
                fontWeight: "bold",
                color: "#999",
                display: "block",
                marginBottom: "8px",
              }}
            >
              DISCIPLINA
            </label>
            <select
              value={formData.disciplina_id}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #e0e0e0",
                boxSizing: "border-box",
              }}
              onChange={(e) =>
                setFormData({ ...formData, disciplina_id: e.target.value })
              }
            >
              {disciplinas.map((disc) => (
                <option key={disc.id} value={disc.id}>
                  {disc.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
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
            value={formData.dia}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #e0e0e0",
              outline: "none",
              boxSizing: "border-box",
            }}
            onChange={(e) => setFormData({ ...formData, dia: e.target.value })}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div>
            <label
              style={{
                fontSize: "11px",
                fontWeight: "bold",
                color: "#999",
                display: "block",
                marginBottom: "8px",
              }}
            >
              DESDE
            </label>
            <input
              type="time"
              value={formData.horaInicio}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #e0e0e0",
                outline: "none",
                boxSizing: "border-box",
              }}
              onChange={(e) =>
                setFormData({ ...formData, horaInicio: e.target.value })
              }
            />
          </div>
          <div>
            <label
              style={{
                fontSize: "11px",
                fontWeight: "bold",
                color: "#999",
                display: "block",
                marginBottom: "8px",
              }}
            >
              HASTA
            </label>
            <input
              type="time"
              value={formData.horaFinal}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #e0e0e0",
                outline: "none",
                boxSizing: "border-box",
              }}
              onChange={(e) =>
                setFormData({ ...formData, horaFinal: e.target.value })
              }
            />
          </div>
        </div>

        {horas > 3 && (
          <p style={{ color: "red", textAlign: "center", fontSize: "13px" }}>
            ⚠️ El tiempo máximo permitido es de 3 horas.
          </p>
        )}

        <div style={{ display: "flex", gap: "15px" }}>
          <button
            onClick={onVolverAdmin}
            style={{
              flex: 1,
              padding: "15px",
              borderRadius: "12px",
              border: "1px solid #ccc",
              backgroundColor: "#f5f5f5",
              color: "#555",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            VOLVER
          </button>
          <button
            disabled={botonBloqueado || cargando}
            onClick={handleSubmit}
            style={{
              flex: 2,
              padding: "15px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: botonBloqueado || cargando ? "#ccc" : "#003366",
              color: "white",
              fontWeight: "bold",
              cursor: botonBloqueado || cargando ? "not-allowed" : "pointer",
            }}
          >
            {cargando ? "CREANDO..." : "CREAR RESERVA"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReservaForm;
