import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../../../shared/components/EmptyState";
import StatusBadge from "../../../shared/components/StatusBadge";
import { formatFechaBO } from "../../../shared/services/apiClient";
import {
  cancelarReserva,
  descargarComprobanteReserva,
  editarReserva,
  getEspacios,
  getReservas,
  habilitarReserva,
} from "../services/reservaService";
import type {
  Espacio,
  Reserva,
  UpdateReservaDto,
} from "../types/reserva.types";

import { ExportarReporteButton } from "../../../shared/components/ExportarReporteButton";
import Spinner from "../../../shared/components/Spinner";
import { useToast } from "../../../shared/hooks/useToast";
import {
  validarCI,
  validarNombreCompleto,
  type ErroresForm,
  mostrarError,
} from "../../../shared/utils/validators";

type TabReservas = "activas" | "canceladas";

function AdminReserva() {
  const navigate = useNavigate();
  const toast = useToast();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [seleccionadaId, setSeleccionadaId] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroEspacio, setFiltroEspacio] = useState("");
  const [tab, setTab] = useState<TabReservas>("activas");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [modoEdicion, setModoEdicion] = useState(false);
  const [formEdicion, setFormEdicion] = useState<UpdateReservaDto>({});
  const [guardando, setGuardando] = useState(false);
  const [confirmandoCancelacion, setConfirmandoCancelacion] = useState<
    number | null
  >(null);
  const [erroresEdicion, setErroresEdicion] = useState<ErroresForm>({});

  const [espacios, setEspacios] = useState<Espacio[]>([]);

  useEffect(() => {
    const tarea = window.setTimeout(() => {
      setCargando(true);
      setError("");

      getReservas({ fecha: filtroFecha || undefined })
        .then((data) => {
          setReservas(data);
          setSeleccionadaId((actual) => {
            if (actual && data.some((reserva) => reserva.id === actual)) {
              return actual;
            }
            return data[0]?.id ?? null;
          });
        })
        .catch((err: unknown) => {
          setError(
            err instanceof Error ? err.message : "Error al cargar reservas",
          );
        })
        .finally(() => setCargando(false));
    }, 0);

    return () => window.clearTimeout(tarea);
  }, [filtroFecha]);

  useEffect(() => {
    getEspacios()
      .then(setEspacios)
      .catch(() => setEspacios([]));
  }, []);

  const reservasFiltradas = useMemo(() => {
    return reservas.filter((reserva) => {
      const texto = `${reserva.nombre_solicitante} ${reserva.ci} ${
        reserva.complemento ?? ""
      } ${reserva.motivo} ${reserva.espacio?.nombre ?? ""}`.toLowerCase();

      const coincideBusqueda = texto.includes(busqueda.toLowerCase());
      const coincideEspacio = filtroEspacio
        ? String(reserva.espacio_id) === filtroEspacio
        : true;
      const coincideTab =
        tab === "activas"
          ? reserva.estado !== "cancelada"
          : reserva.estado === "cancelada";

      return coincideBusqueda && coincideEspacio && coincideTab;
    });
  }, [busqueda, filtroEspacio, reservas, tab]);

  const reservasActivas = reservas.filter(
    (reserva) => reserva.estado !== "cancelada",
  ).length;

  const reservasCanceladas = reservas.filter(
    (reserva) => reserva.estado === "cancelada",
  ).length;

  const seleccionada =
    reservas.find((reserva) => reserva.id === seleccionadaId) ?? null;

  const estaCancelada = seleccionada?.estado === "cancelada";

  const filtrosReporte = useMemo(
    () => ({
      desde: "",
      hasta: "",
      estado: tab,
    }),
    [tab],
  );

  const limpiarEdicion = () => {
    setModoEdicion(false);
    setFormEdicion({});
    setError("");
  };

  const abrirEdicion = () => {
    if (!seleccionada) return;

    setFormEdicion({
      nombre_solicitante: seleccionada.nombre_solicitante,
      ci: seleccionada.ci,
      complemento: seleccionada.complemento ?? undefined,
      fecha_reserva: seleccionada.fecha_reserva,
      hora_inicio: seleccionada.hora_inicio,
      hora_fin: seleccionada.hora_fin,
      motivo: seleccionada.motivo,
      espacio_id: seleccionada.espacio_id,
    });
    setModoEdicion(true);
    setError("");
  };

  const actualizarCampo = (
    campo: keyof UpdateReservaDto,
    valor: string | number,
  ) => {
    setFormEdicion((prev) => ({ ...prev, [campo]: valor }));
  };

  const reemplazarReserva = (actualizada: Reserva) => {
    setReservas((prev) =>
      prev.map((reserva) =>
        reserva.id === actualizada.id ? actualizada : reserva,
      ),
    );
    setSeleccionadaId(actualizada.id);
  };

  const validarCampoEdicion = (
    campo: string,
    valor: unknown,
  ): string | null => {
    switch (campo) {
      case "nombre_solicitante":
        return validarNombreCompleto(valor as string, "El nombre");
      case "ci":
        return validarCI(String(valor));
      case "espacio_id":
        return valor ? null : "Debes seleccionar un espacio.";
      case "fecha_reserva":
        return valor ? null : "La fecha es obligatoria.";
      case "hora_inicio":
        return valor ? null : "La hora de inicio es obligatoria.";
      case "hora_fin":
        return valor ? null : "La hora de fin es obligatoria.";
      case "motivo":
        return (valor as string)?.trim() ? null : "El motivo es obligatorio.";
      default:
        return null;
    }
  };

  const handleBlurEdicion = (campo: string) => {
    setErroresEdicion((prev) => ({
      ...prev,
      [campo]: validarCampoEdicion(
        campo,
        formEdicion[campo as keyof UpdateReservaDto],
      ),
    }));
  };

  const handleGuardarEdicion = async () => {
    if (!seleccionada) return;

    const nuevosErrores: ErroresForm = {
      nombre_solicitante:
        formEdicion.nombre_solicitante !== undefined
          ? validarNombreCompleto(formEdicion.nombre_solicitante, "El nombre")
          : null,
      ci:
        formEdicion.ci !== undefined ? validarCI(String(formEdicion.ci)) : null,
      motivo:
        formEdicion.motivo !== undefined
          ? formEdicion.motivo.trim()
            ? null
            : "El motivo es obligatorio."
          : null,
      espacio_id: !formEdicion.espacio_id
        ? "Debes seleccionar un espacio."
        : null,
      fecha_reserva: !formEdicion.fecha_reserva ? "La fecha es obligatoria." : null,
      hora_inicio: !formEdicion.hora_inicio
        ? "La hora de inicio es obligatoria."
        : null,
      hora_fin: !formEdicion.hora_fin ? "La hora de fin es obligatoria." : null,
    };
    setErroresEdicion(nuevosErrores);
    if (Object.values(nuevosErrores).some(Boolean)) return;

    setGuardando(true);
    setError("");

    try {
      const actualizada = await editarReserva(seleccionada.id, formEdicion);
      reemplazarReserva(actualizada);
      limpiarEdicion();
      toast.success("Cambios guardados correctamente.");
    } catch {
      setError(
        "No se pudieron guardar los cambios. Verifica los datos e intenta de nuevo.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelarReserva = async () => {
    if (!seleccionada || confirmandoCancelacion !== seleccionada.id) return;

    setError("");

    try {
      const actualizada = await cancelarReserva(seleccionada.id);
      reemplazarReserva(actualizada);
      setTab("canceladas");
      limpiarEdicion();
      toast.success("Reserva cancelada correctamente.");
    } catch {
      setError("No se pudo cancelar la reserva. Intenta de nuevo.");
    } finally {
      setConfirmandoCancelacion(null);
    }
  };

  const handleHabilitarReserva = async () => {
    if (!seleccionada) return;

    setError("");

    try {
      const actualizada = await habilitarReserva(seleccionada.id);
      reemplazarReserva(actualizada);
      setTab("activas");
      limpiarEdicion();
      toast.success("Reserva habilitada correctamente.");
    } catch {
      setError("No se pudo habilitar la reserva. Intenta de nuevo.");
    }
  };

  const handleDescargarPdf = async (reserva: Reserva) => {
    const nombreArchivo = `comprobante-${reserva.nombre_solicitante
      .toLowerCase()
      .replaceAll(" ", "-")}-${reserva.id}.pdf`;

    try {
      await descargarComprobanteReserva(reserva.id, nombreArchivo);
    } catch {
      setError("No se pudo descargar el comprobante. Verifica tu conexión.");
    }
  };

  return (
    <section className="two-column-layout">
      <aside className="panel-card side-panel">
        <div
          className="side-title-row"
          style={{ flexWrap: "wrap", gap: "10px" }}
        >
          <div>
            <span className="section-label">Filtrar reservas</span>
            <h2>Reservas</h2>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <ExportarReporteButton
              endpoint="/reservas/reporte"
              filtrosActuales={filtrosReporte}
              nombreArchivoBase="Reporte_Reservas_Deportes"
              filtrosConfig={[
                { name: "desde", label: "Fecha inicio", type: "date" },
                { name: "hasta", label: "Fecha fin", type: "date" },
                {
                  name: "estado",
                  label: "Estado",
                  type: "select",
                  options: [
                    { value: "todos", label: "Todos" },
                    { value: "confirmada", label: "Confirmada" },
                    { value: "cancelada", label: "Cancelada" },
                  ],
                },
              ]}
            />
            <button
              className="btn btn-primary small"
              onClick={() => navigate("/reservas/nueva")}
            >
              + Crear
            </button>
          </div>
        </div>

        <div className="filters-grid reserva-filters">
          <label className="field full">
            <span>Buscar</span>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre, CI o motivo"
            />
          </label>

          <label className="field">
            <span>Fecha</span>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => {
                setFiltroFecha(e.target.value);
                setSeleccionadaId(null);
                limpiarEdicion();
              }}
            />
          </label>

          <label className="field">
            <span>Espacio</span>
            <select
              value={filtroEspacio}
              onChange={(e) => {
                setFiltroEspacio(e.target.value);
                setSeleccionadaId(null);
                limpiarEdicion();
              }}
            >
              <option value="">Todos</option>
              {espacios.map((espacio) => (
                <option key={espacio.id} value={espacio.id}>
                  {espacio.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="segmented-inline reserva-tabs">
          <button
            type="button"
            className={tab === "activas" ? "active" : ""}
            onClick={() => {
              setTab("activas");
              setSeleccionadaId(null);
              limpiarEdicion();
            }}
          >
            Activas <span>{reservasActivas}</span>
          </button>

          <button
            type="button"
            className={tab === "canceladas" ? "active" : ""}
            onClick={() => {
              setTab("canceladas");
              setSeleccionadaId(null);
              limpiarEdicion();
            }}
          >
            Canceladas <span>{reservasCanceladas}</span>
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}
        {cargando && <Spinner texto="Cargando reservas..." />}
        {!cargando && reservasFiltradas.length === 0 && (
          <EmptyState
            title={
              tab === "activas"
                ? "No hay reservas activas"
                : "No hay reservas canceladas"
            }
          />
        )}

        <div className="list-stack">
          {reservasFiltradas.map((reserva) => (
            <button
              key={reserva.id}
              className={
                reserva.id === seleccionadaId
                  ? "list-card selected"
                  : "list-card"
              }
              onClick={() => {
                setSeleccionadaId(reserva.id);
                limpiarEdicion();
              }}
            >
              <strong>{reserva.nombre_solicitante}</strong>
              <span>
                CI: {reserva.complemento ? `${reserva.ci} ${reserva.complemento}` : reserva.ci}
              </span>
              <span>
                {reserva.espacio?.nombre || "Espacio"} ·{" "}
                {formatFechaBO(reserva.fecha_reserva)}
              </span>
              <span>
                {reserva.hora_inicio} - {reserva.hora_fin}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <main className="panel-card detail-panel">
        {!seleccionada ? (
          <EmptyState
            title="Selecciona una reserva"
            description="Aquí verás el detalle completo, podrás editarla, cancelarla o descargar el comprobante."
          />
        ) : (
          <>
            <div className="detail-header">
              <div>
                <span className="section-label">
                  {modoEdicion
                    ? "Editar información de la reserva"
                    : "Información de la solicitud"}
                </span>
                <h2>{seleccionada.nombre_solicitante}</h2>
                <p>UCB - Dirección de Deportes</p>
              </div>
              <StatusBadge
                tone={
                  seleccionada.estado === "cancelada"
                    ? "danger"
                    : seleccionada.estado === "confirmada"
                      ? "success"
                      : "warning"
                }
              >
                {seleccionada.estado}
              </StatusBadge>
            </div>

            {modoEdicion ? (
              <>
                <div className="form-grid">
                  <label className="field">
                    <span>Nombre completo</span>
                    <input
                      id="edit-nombre"
                      value={formEdicion.nombre_solicitante ?? ""}
                      onChange={(e) => {
                        actualizarCampo("nombre_solicitante", e.target.value);
                        setErroresEdicion((p) => ({
                          ...p,
                          nombre_solicitante: null,
                        }));
                      }}
                      aria-describedby={
                        mostrarError(erroresEdicion, "nombre_solicitante")
                          ? "error-edit-nombre"
                          : undefined
                      }
                    />
                    {mostrarError(erroresEdicion, "nombre_solicitante") && (
                      <small id="error-edit-nombre" className="field-error">
                        {mostrarError(erroresEdicion, "nombre_solicitante")}
                      </small>
                    )}
                  </label>

                  <label className="field">
                    <span>CI</span>
                    <input
                      id="edit-ci"
                      value={formEdicion.ci ?? ""}
                      onChange={(e) => {
                        actualizarCampo("ci", Number(e.target.value));
                        setErroresEdicion((p) => ({ ...p, ci: null }));
                      }}
                      aria-describedby={
                        mostrarError(erroresEdicion, "ci")
                          ? "error-edit-ci"
                          : undefined
                      }
                    />
                    {mostrarError(erroresEdicion, "ci") && (
                      <small id="error-edit-ci" className="field-error">
                        {mostrarError(erroresEdicion, "ci")}
                      </small>
                    )}
                  </label>

                  <label className="field">
                    <span>Complemento</span>
                    <input
                      id="edit-complemento"
                      value={formEdicion.complemento ?? ""}
                      onChange={(e) =>
                        actualizarCampo("complemento", e.target.value)
                      }
                      maxLength={5}
                      placeholder="Ej. LP"
                    />
                  </label>

                  <label className="field">
                    <span>Espacio</span>
                    <select
                      id="edit-espacio"
                      value={formEdicion.espacio_id ?? ""}
                      onChange={(e) => {
                        actualizarCampo("espacio_id", Number(e.target.value));
                        setErroresEdicion((p) => ({ ...p, espacio_id: null }));
                      }}
                      onBlur={() => handleBlurEdicion("espacio_id")}
                      aria-describedby={
                        mostrarError(erroresEdicion, "espacio_id")
                          ? "error-edit-espacio"
                          : undefined
                      }
                    >
                      <option value="">Selecciona un espacio</option>
                      {espacios.map((espacio) => (
                        <option key={espacio.id} value={espacio.id}>
                          {espacio.nombre}
                        </option>
                      ))}
                    </select>
                    {mostrarError(erroresEdicion, "espacio_id") && (
                      <small id="error-edit-espacio" className="field-error">
                        {mostrarError(erroresEdicion, "espacio_id")}
                      </small>
                    )}
                  </label>

                  <label className="field">
                    <span>Fecha</span>
                    <input
                      id="edit-fecha"
                      type="date"
                      value={formEdicion.fecha_reserva ?? ""}
                      onChange={(e) => {
                        actualizarCampo("fecha_reserva", e.target.value);
                        setErroresEdicion((p) => ({ ...p, fecha_reserva: null }));
                      }}
                      onBlur={() => handleBlurEdicion("fecha_reserva")}
                      aria-describedby={
                        mostrarError(erroresEdicion, "fecha_reserva")
                          ? "error-edit-fecha"
                          : undefined
                      }
                    />
                    {mostrarError(erroresEdicion, "fecha_reserva") && (
                      <small id="error-edit-fecha" className="field-error">
                        {mostrarError(erroresEdicion, "fecha_reserva")}
                      </small>
                    )}
                  </label>

                  <label className="field">
                    <span>Hora inicio</span>
                    <input
                      id="edit-hora-inicio"
                      type="time"
                      step="1800"
                      value={formEdicion.hora_inicio ?? ""}
                      onChange={(e) => {
                        actualizarCampo("hora_inicio", e.target.value);
                        setErroresEdicion((p) => ({ ...p, hora_inicio: null }));
                      }}
                      onBlur={() => handleBlurEdicion("hora_inicio")}
                      aria-describedby={
                        mostrarError(erroresEdicion, "hora_inicio")
                          ? "error-edit-hora-inicio"
                          : undefined
                      }
                    />
                    {mostrarError(erroresEdicion, "hora_inicio") && (
                      <small
                        id="error-edit-hora-inicio"
                        className="field-error"
                      >
                        {mostrarError(erroresEdicion, "hora_inicio")}
                      </small>
                    )}
                  </label>

                  <label className="field">
                    <span>Hora fin</span>
                    <input
                      id="edit-hora-fin"
                      type="time"
                      step="1800"
                      value={formEdicion.hora_fin ?? ""}
                      onChange={(e) => {
                        actualizarCampo("hora_fin", e.target.value);
                        setErroresEdicion((p) => ({ ...p, hora_fin: null }));
                      }}
                      onBlur={() => handleBlurEdicion("hora_fin")}
                      aria-describedby={
                        mostrarError(erroresEdicion, "hora_fin")
                          ? "error-edit-hora-fin"
                          : undefined
                      }
                    />
                    {mostrarError(erroresEdicion, "hora_fin") && (
                      <small id="error-edit-hora-fin" className="field-error">
                        {mostrarError(erroresEdicion, "hora_fin")}
                      </small>
                    )}
                  </label>

                  <label className="field full">
                    <span>Motivo</span>
                    <textarea
                      id="edit-motivo"
                      value={formEdicion.motivo ?? ""}
                      onChange={(e) => {
                        actualizarCampo("motivo", e.target.value);
                        setErroresEdicion((p) => ({ ...p, motivo: null }));
                      }}
                      onBlur={() => handleBlurEdicion("motivo")}
                      aria-describedby={
                        mostrarError(erroresEdicion, "motivo")
                          ? "error-edit-motivo"
                          : undefined
                      }
                    />
                    {mostrarError(erroresEdicion, "motivo") && (
                      <small id="error-edit-motivo" className="field-error">
                        {mostrarError(erroresEdicion, "motivo")}
                      </small>
                    )}
                  </label>
                </div>

                <div className="form-actions full reserva-actions">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={limpiarEdicion}
                    disabled={guardando}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleGuardarEdicion}
                    disabled={guardando}
                  >
                    {guardando ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="info-grid">
                  <div>
                    <span>CI</span>
                    <strong>{seleccionada.complemento ? `${seleccionada.ci} ${seleccionada.complemento}` : seleccionada.ci}</strong>
                  </div>
                  <div>
                    <span>Espacio</span>
                    <strong>
                      {seleccionada.espacio?.nombre || seleccionada.espacio_id}
                    </strong>
                  </div>
                  <div>
                    <span>Tipo reserva</span>
                    <strong>{seleccionada.tipo_reserva}</strong>
                  </div>
                  <div>
                    <span>Fecha y horario</span>
                    <strong>
                      {formatFechaBO(seleccionada.fecha_reserva)} ·{" "}
                      {seleccionada.hora_inicio} - {seleccionada.hora_fin}
                    </strong>
                  </div>
                  <div className="full">
                    <span>Motivo</span>
                    <strong>{seleccionada.motivo}</strong>
                  </div>
                </div>

                <div className="form-actions reserva-actions">
                  {!estaCancelada && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={abrirEdicion}
                    >
                      Editar
                    </button>
                  )}

                  {estaCancelada ? (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleHabilitarReserva}
                    >
                      Habilitar
                    </button>
                  ) : (
                    <>
                      {confirmandoCancelacion === seleccionada.id ? (
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ fontSize: "14px" }}>¿Cancelar?</span>
                          <button
                            type="button"
                            className="btn btn-ghost small"
                            onClick={handleCancelarReserva}
                          >
                            Sí, cancelar
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline small"
                            onClick={() => setConfirmandoCancelacion(null)}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() =>
                            setConfirmandoCancelacion(seleccionada.id)
                          }
                        >
                          Cancelar reserva
                        </button>
                      )}
                    </>
                  )}

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleDescargarPdf(seleccionada)}
                  >
                    Descargar PDF
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </section>
  );
}

export default AdminReserva;
