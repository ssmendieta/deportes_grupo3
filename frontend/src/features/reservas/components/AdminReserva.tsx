import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../../shared/components/EmptyState";
import StatusBadge from "../../../shared/components/StatusBadge";
import { formatFechaBO } from "../../../shared/services/apiClient";
import {
  cancelarReserva,
  descargarComprobanteReserva,
  editarReserva,
  getDisciplinasReserva,
  getEspacios,
  getReservas,
  habilitarReserva,
} from "../services/reservaService";
import type {
  DisciplinaBasica,
  Espacio,
  Reserva,
  UpdateReservaDto,
} from "../types/reserva.types";

type Props = {
  onCrearReserva: () => void;
};

type TabReservas = "activas" | "canceladas";

function AdminReserva({ onCrearReserva }: Props) {
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

  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [disciplinas, setDisciplinas] = useState<DisciplinaBasica[]>([]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setCargando(true);
      setError("");

      void getReservas({ fecha: filtroFecha || undefined })
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

    return () => window.clearTimeout(timeoutId);
  }, [filtroFecha]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void getEspacios().then(setEspacios).catch(() => setEspacios([]));
      void getDisciplinasReserva()
        .then(setDisciplinas)
        .catch(() => setDisciplinas([]));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const reservasFiltradas = useMemo(() => {
    return reservas.filter((reserva) => {
      const texto = `${reserva.nombre_solicitante} ${reserva.carnet} ${
        reserva.motivo
      } ${reserva.espacio?.nombre ?? ""} ${
        reserva.disciplina?.nombre ?? ""
      }`.toLowerCase();

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

  const limpiarEdicion = () => {
    setModoEdicion(false);
    setFormEdicion({});
    setError("");
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

  const handleGuardarEdicion = async () => {
    if (!seleccionada) return;

    setGuardando(true);
    setError("");

    try {
      const actualizada = await editarReserva(seleccionada.id, formEdicion);
      reemplazarReserva(actualizada);
      limpiarEdicion();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "No se pudo editar la reserva",
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelarReserva = async () => {
    if (!seleccionada) return;
    const confirmar = window.confirm(
      "¿Seguro que deseas cancelar esta reserva? Se mantendrá en el historial.",
    );
    if (!confirmar) return;

    setError("");

    try {
      const actualizada = await cancelarReserva(seleccionada.id);
      reemplazarReserva(actualizada);
      setTab("canceladas");
      limpiarEdicion();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "No se pudo cancelar la reserva",
      );
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
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "No se pudo habilitar la reserva",
      );
    }
  };

  const handleDescargarPdf = async (reserva: Reserva) => {
    const nombreSugerido = `comprobante-${reserva.nombre_solicitante
      .toLowerCase()
      .replaceAll(" ", "-")}-${reserva.id}.pdf`;

    const nombreArchivo = window.prompt(
      "Nombre para guardar el comprobante:",
      nombreSugerido,
    );

    if (!nombreArchivo) return;

    try {
      await descargarComprobanteReserva(reserva.id, nombreArchivo);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "No se pudo descargar el PDF",
      );
    }
  };

  return (
    <section className="two-column-layout">
      <aside className="panel-card side-panel">
        <div className="side-title-row">
          <div>
            <span className="section-label">Filtrar reservas</span>
            <h2>Reservas</h2>
          </div>
          <button className="btn btn-primary small" onClick={onCrearReserva}>
            + Crear
          </button>
        </div>

        <div className="filters-grid reserva-filters">
          <label className="field full">
            <span>Buscar</span>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre, CI, motivo o disciplina"
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
        {cargando && <p>Cargando reservas...</p>}
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
                reserva.id === seleccionadaId ? "list-card selected" : "list-card"
              }
              onClick={() => {
                setSeleccionadaId(reserva.id);
                limpiarEdicion();
              }}
            >
              <strong>{reserva.nombre_solicitante}</strong>
              <span>
                {reserva.espacio?.nombre || "Espacio"} · {formatFechaBO(reserva.fecha)}
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
                      value={formEdicion.nombre_solicitante ?? ""}
                      onChange={(e) =>
                        actualizarCampo("nombre_solicitante", e.target.value)
                      }
                    />
                  </label>

                  <label className="field">
                    <span>Carnet</span>
                    <input
                      value={formEdicion.carnet ?? ""}
                      onChange={(e) => actualizarCampo("carnet", e.target.value)}
                    />
                  </label>

                  <label className="field">
                    <span>Espacio</span>
                    <select
                      value={formEdicion.espacio_id ?? ""}
                      onChange={(e) =>
                        actualizarCampo("espacio_id", Number(e.target.value))
                      }
                    >
                      <option value="">Selecciona un espacio</option>
                      {espacios.map((espacio) => (
                        <option key={espacio.id} value={espacio.id}>
                          {espacio.nombre}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>Disciplina</span>
                    <select
                      value={formEdicion.disciplina_id ?? ""}
                      onChange={(e) =>
                        actualizarCampo("disciplina_id", Number(e.target.value))
                      }
                    >
                      <option value="">Selecciona una disciplina</option>
                      {disciplinas.map((disciplina) => (
                        <option key={disciplina.id} value={disciplina.id}>
                          {disciplina.nombre}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>Fecha</span>
                    <input
                      type="date"
                      value={formEdicion.fecha ?? ""}
                      onChange={(e) => actualizarCampo("fecha", e.target.value)}
                    />
                  </label>

                  <label className="field">
                    <span>Hora inicio</span>
                    <input
                      type="time"
                      step="1800"
                      value={formEdicion.hora_inicio ?? ""}
                      onChange={(e) =>
                        actualizarCampo("hora_inicio", e.target.value)
                      }
                    />
                  </label>

                  <label className="field">
                    <span>Hora fin</span>
                    <input
                      type="time"
                      step="1800"
                      value={formEdicion.hora_fin ?? ""}
                      onChange={(e) => actualizarCampo("hora_fin", e.target.value)}
                    />
                  </label>

                  <label className="field full">
                    <span>Motivo</span>
                    <textarea
                      value={formEdicion.motivo ?? ""}
                      onChange={(e) => actualizarCampo("motivo", e.target.value)}
                    />
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
                    <span>Carnet</span>
                    <strong>{seleccionada.carnet}</strong>
                  </div>
                  <div>
                    <span>Espacio</span>
                    <strong>
                      {seleccionada.espacio?.nombre || seleccionada.espacio_id}
                    </strong>
                  </div>
                  <div>
                    <span>Disciplina</span>
                    <strong>
                      {seleccionada.disciplina?.nombre || seleccionada.disciplina_id}
                    </strong>
                  </div>
                  <div>
                    <span>Fecha y horario</span>
                    <strong>
                      {formatFechaBO(seleccionada.fecha)} · {seleccionada.hora_inicio} -{" "}
                      {seleccionada.hora_fin}
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
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={handleCancelarReserva}
                    >
                      Cancelar reserva
                    </button>
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
