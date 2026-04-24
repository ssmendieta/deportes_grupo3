import React, { useState, useEffect } from "react";
import {
  getReservas,
  cancelarReserva,
  habilitarReserva,
  editarReserva,
  descargarComprobante,
  getDisciplinas,
  getEspacios,
  type Reserva,
  type Disciplina,
  type Espacio,
  type UpdateReservaDto,
} from "../../../services/reservaService";

type AdminReservaProps = {
  onCrearReserva: () => void;
};

type Tab = "activas" | "canceladas";

const AdminReserva: React.FC<AdminReservaProps> = ({ onCrearReserva }) => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [seleccionada, setSeleccionada] = useState<Reserva | null>(null);
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroEspacio, setFiltroEspacio] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("activas");

  const [modoEdicion, setModoEdicion] = useState(false);
  const [formEdicion, setFormEdicion] = useState<UpdateReservaDto>({});
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const params: { fecha?: string } = {};
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

  useEffect(() => {
    getDisciplinas()
      .then(setDisciplinas)
      .catch(() => {});
    getEspacios()
      .then(setEspacios)
      .catch(() => {});
  }, []);

  const handleCancelar = async (id: number) => {
    try {
      const actualizada = await cancelarReserva(id);
      setReservas((prev) => prev.map((r) => (r.id === id ? actualizada : r)));
      setSeleccionada(actualizada);
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    }
  };

  const handleHabilitar = async (id: number) => {
    try {
      const actualizada = await habilitarReserva(id);
      setReservas((prev) => prev.map((r) => (r.id === id ? actualizada : r)));
      setSeleccionada(actualizada);
      setTab("activas");
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    }
  };

  const handleVerPDF = async (id: number) => {
    try {
      await descargarComprobante(id);
    } catch {
      setError("Error al generar el comprobante");
    }
  };

  const abrirEdicion = () => {
    if (!seleccionada) return;
    setFormEdicion({
      nombre_solicitante: seleccionada.nombre_solicitante,
      carnet: seleccionada.carnet,
      fecha: seleccionada.fecha,
      hora_inicio: seleccionada.hora_inicio,
      hora_fin: seleccionada.hora_fin,
      motivo: seleccionada.motivo,
      disciplina_id: seleccionada.disciplina_id,
      espacio_id: seleccionada.espacio_id,
    });
    setModoEdicion(true);
    setError("");
  };

  const cancelarEdicion = () => {
    setModoEdicion(false);
    setFormEdicion({});
    setError("");
  };

  const handleGuardar = async () => {
    if (!seleccionada) return;
    setGuardando(true);
    try {
      const actualizada = await editarReserva(seleccionada.id, formEdicion);
      setReservas((prev) =>
        prev.map((r) => (r.id === seleccionada.id ? actualizada : r)),
      );
      setSeleccionada(actualizada);
      setModoEdicion(false);
      setFormEdicion({});
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  const campo = (key: keyof UpdateReservaDto, value: string) =>
    setFormEdicion((prev) => ({ ...prev, [key]: value }));

  const reservasFiltradas = reservas.filter((r) => {
    const coincideEspacio = filtroEspacio
      ? r.espacio.nombre === filtroEspacio
      : true;
    const coincideTab =
      tab === "activas" ? r.estado !== "cancelada" : r.estado === "cancelada";
    return coincideEspacio && coincideTab;
  });

  const estaCancelada = seleccionada?.estado === "cancelada";

  const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: "bold",
    color: "#999",
    display: "block",
    marginBottom: "6px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #e0e0e0",
    outline: "none",
    fontSize: "14px",
    boxSizing: "border-box",
  };

  const valorStyle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: "500",
  };

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
        {/* ── Panel izquierdo ── */}
        <div style={{ width: "320px", flexShrink: 0 }}>
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
              <label style={labelStyle}>FECHA</label>
              <input
                type="date"
                value={filtroFecha}
                onChange={(e) => {
                  setFiltroFecha(e.target.value);
                  setSeleccionada(null);
                }}
                style={{ ...inputStyle, width: "90%" }}
              />
            </div>

            <div style={{ marginBottom: "18px" }}>
              <label style={labelStyle}>ESPACIO</label>
              <select
                value={filtroEspacio}
                onChange={(e) => {
                  setFiltroEspacio(e.target.value);
                  setSeleccionada(null);
                }}
                style={inputStyle}
              >
                <option value="">Todos</option>
                {espacios.map((e) => (
                  <option key={e.id} value={e.nombre}>
                    {e.nombre}
                  </option>
                ))}
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

          <div
            style={{
              display: "flex",
              backgroundColor: "white",
              borderRadius: "14px",
              padding: "4px",
              marginBottom: "14px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            }}
          >
            {(["activas", "canceladas"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setSeleccionada(null);
                  setModoEdicion(false);
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  fontSize: "12px",
                  cursor: "pointer",
                  backgroundColor: tab === t ? "#003366" : "transparent",
                  color: tab === t ? "white" : "#999",
                  transition: "all 0.15s",
                }}
              >
                {t === "activas" ? "ACTIVAS" : "CANCELADAS"}
                <span
                  style={{
                    marginLeft: "6px",
                    backgroundColor:
                      tab === t ? "rgba(255,255,255,0.2)" : "#f0f0f0",
                    color: tab === t ? "white" : "#666",
                    borderRadius: "999px",
                    padding: "1px 7px",
                    fontSize: "11px",
                  }}
                >
                  {
                    reservas.filter((r) =>
                      t === "activas"
                        ? r.estado !== "cancelada"
                        : r.estado === "cancelada",
                    ).length
                  }
                </span>
              </button>
            ))}
          </div>

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
                onClick={() => {
                  setSeleccionada(res);
                  setModoEdicion(false);
                  setError("");
                }}
                style={{
                  backgroundColor:
                    seleccionada?.id === res.id ? "#003366" : "white",
                  color: seleccionada?.id === res.id ? "white" : "#333",
                  padding: "16px 20px",
                  borderRadius: "15px",
                  marginBottom: "10px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                  borderLeft:
                    tab === "canceladas" ? "3px solid #cc0000" : "none",
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
                fontSize: "13px",
              }}
            >
              {tab === "activas"
                ? "No hay reservas activas"
                : "No hay reservas canceladas"}
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <h2 style={{ color: "#333", margin: 0 }}>
                    {modoEdicion
                      ? "Editar Reserva"
                      : "Información de la Reserva"}
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
                </div>

                {!modoEdicion && !estaCancelada && (
                  <button
                    onClick={abrirEdicion}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#f0f4ff",
                      color: "#003366",
                      border: "1px solid #c0d0ee",
                      borderRadius: "12px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    ✏️ EDITAR
                  </button>
                )}
              </div>

              {modoEdicion ? (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "24px",
                      marginTop: "32px",
                    }}
                  >
                    <div>
                      <label style={labelStyle}>NOMBRE COMPLETO</label>
                      <input
                        style={inputStyle}
                        value={formEdicion.nombre_solicitante ?? ""}
                        onChange={(e) =>
                          campo("nombre_solicitante", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>CARNET</label>
                      <input
                        style={inputStyle}
                        value={formEdicion.carnet ?? ""}
                        onChange={(e) => campo("carnet", e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>ESPACIO</label>
                      <select
                        style={inputStyle}
                        value={formEdicion.espacio_id ?? ""}
                        onChange={(e) =>
                          setFormEdicion((prev) => ({
                            ...prev,
                            espacio_id: Number(e.target.value),
                          }))
                        }
                      >
                        {espacios.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>DISCIPLINA</label>
                      <select
                        style={inputStyle}
                        value={formEdicion.disciplina_id ?? ""}
                        onChange={(e) =>
                          setFormEdicion((prev) => ({
                            ...prev,
                            disciplina_id: Number(e.target.value),
                          }))
                        }
                      >
                        {disciplinas.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>FECHA</label>
                      <input
                        type="date"
                        style={inputStyle}
                        value={formEdicion.fecha ?? ""}
                        onChange={(e) => campo("fecha", e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>HORA INICIO</label>
                      <input
                        type="time"
                        style={inputStyle}
                        value={formEdicion.hora_inicio ?? ""}
                        onChange={(e) => campo("hora_inicio", e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>HORA FIN</label>
                      <input
                        type="time"
                        style={inputStyle}
                        value={formEdicion.hora_fin ?? ""}
                        onChange={(e) => campo("hora_fin", e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>MOTIVO</label>
                      <input
                        style={inputStyle}
                        value={formEdicion.motivo ?? ""}
                        onChange={(e) => campo("motivo", e.target.value)}
                      />
                    </div>
                  </div>

                  {error && (
                    <p
                      style={{
                        color: "red",
                        fontSize: "13px",
                        marginTop: "16px",
                      }}
                    >
                      {error}
                    </p>
                  )}

                  <div
                    style={{ display: "flex", gap: "16px", marginTop: "40px" }}
                  >
                    <button
                      onClick={cancelarEdicion}
                      style={{
                        flex: 1,
                        padding: "16px",
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
                      onClick={handleGuardar}
                      disabled={guardando}
                      style={{
                        flex: 1,
                        padding: "16px",
                        backgroundColor: guardando ? "#aaa" : "#003366",
                        color: "white",
                        border: "none",
                        borderRadius: "12px",
                        fontWeight: "bold",
                        cursor: guardando ? "not-allowed" : "pointer",
                      }}
                    >
                      {guardando ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "40px",
                      marginTop: "40px",
                    }}
                  >
                    {[
                      {
                        label: "NOMBRE COMPLETO",
                        valor: seleccionada.nombre_solicitante,
                      },
                      { label: "CARNET", valor: seleccionada.carnet },
                      { label: "ESPACIO", valor: seleccionada.espacio.nombre },
                      {
                        label: "DISCIPLINA",
                        valor: seleccionada.disciplina.nombre,
                      },
                      {
                        label: "HORARIO",
                        valor: `${new Date(seleccionada.fecha).toLocaleDateString()} | ${seleccionada.hora_inicio} - ${seleccionada.hora_fin}`,
                      },
                      { label: "MOTIVO", valor: seleccionada.motivo },
                    ].map(({ label, valor }) => (
                      <div key={label}>
                        <label style={labelStyle}>{label}</label>
                        <div style={valorStyle}>{valor}</div>
                      </div>
                    ))}

                    <div>
                      <label style={labelStyle}>ESTADO</label>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: estaCancelada ? "#cc0000" : "#007a33",
                        }}
                      >
                        {seleccionada.estado.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{ display: "flex", gap: "20px", marginTop: "60px" }}
                  >
                    {estaCancelada ? (
                      <button
                        onClick={() => handleHabilitar(seleccionada.id)}
                        style={{
                          flex: 1,
                          padding: "18px",
                          backgroundColor: "#007a33",
                          color: "white",
                          border: "none",
                          borderRadius: "12px",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                      >
                        HABILITAR RESERVA
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCancelar(seleccionada.id)}
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
                        CANCELAR RESERVA
                      </button>
                    )}

                    <button
                      onClick={() =>
                        !estaCancelada && handleVerPDF(seleccionada.id)
                      }
                      disabled={estaCancelada}
                      style={{
                        flex: 1,
                        padding: "18px",
                        backgroundColor: estaCancelada ? "#e0e0e0" : "#003366",
                        color: estaCancelada ? "#aaa" : "white",
                        border: "none",
                        borderRadius: "12px",
                        fontWeight: "bold",
                        cursor: estaCancelada ? "not-allowed" : "pointer",
                      }}
                    >
                      VER PDF
                    </button>
                  </div>
                </>
              )}
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
