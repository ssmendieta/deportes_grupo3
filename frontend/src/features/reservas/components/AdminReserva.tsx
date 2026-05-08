import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../../shared/components/EmptyState";
import StatusBadge from "../../../shared/components/StatusBadge";
import { formatFechaBO } from "../../../shared/services/apiClient";
import {descargarComprobanteReserva, getReservas,} from "../services/reservaService";
import type { Reserva } from "../types/reserva.types";

type Props = {
  onCrearReserva: () => void;
};

function AdminReserva({ onCrearReserva }: Props) {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [seleccionadaId, setSeleccionadaId] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void getReservas()
        .then((data) => {
          setReservas(data);
          setSeleccionadaId(data[0]?.id ?? null);
        })
        .finally(() => setCargando(false));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const reservasFiltradas = useMemo(() => {
    return reservas.filter((reserva) =>
      `${reserva.nombre_solicitante} ${reserva.carnet} ${reserva.motivo}`.toLowerCase().includes(busqueda.toLowerCase()),
    );
  }, [busqueda, reservas]);

  const seleccionada = reservas.find((reserva) => reserva.id === seleccionadaId) ?? null;

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
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "No se pudo descargar el PDF",
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
          <button className="btn btn-primary small" onClick={onCrearReserva}>+ Crear</button>
        </div>

        <input className="search-input" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, CI o motivo" />

        {cargando && <p>Cargando reservas...</p>}
        {!cargando && reservasFiltradas.length === 0 && <EmptyState title="No hay reservas" />}

        <div className="list-stack">
          {reservasFiltradas.map((reserva) => (
            <button
              key={reserva.id}
              className={reserva.id === seleccionadaId ? "list-card selected" : "list-card"}
              onClick={() => setSeleccionadaId(reserva.id)}
            >
              <strong>{reserva.nombre_solicitante}</strong>
              <span>{reserva.espacio?.nombre || "Espacio"} · {formatFechaBO(reserva.fecha)}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="panel-card detail-panel">
        {!seleccionada ? (
          <EmptyState title="Selecciona una reserva" description="Aquí verás el detalle completo y el comprobante." />
        ) : (
          <>
            <div className="detail-header">
              <div>
                <span className="section-label">Información de la solicitud</span>
                <h2>{seleccionada.nombre_solicitante}</h2>
              </div>
              <StatusBadge tone={seleccionada.estado === "confirmada" ? "success" : "warning"}>{seleccionada.estado}</StatusBadge>
            </div>

            <div className="info-grid">
              <div><span>Carnet</span><strong>{seleccionada.carnet}</strong></div>
              <div><span>Espacio</span><strong>{seleccionada.espacio?.nombre || seleccionada.espacio_id}</strong></div>
              <div><span>Disciplina</span><strong>{seleccionada.disciplina?.nombre || seleccionada.disciplina_id}</strong></div>
              <div><span>Fecha y horario</span><strong>{formatFechaBO(seleccionada.fecha)} · {seleccionada.hora_inicio} - {seleccionada.hora_fin}</strong></div>
              <div className="full"><span>Motivo</span><strong>{seleccionada.motivo}</strong></div>
            </div>

            <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleDescargarPdf(seleccionada)}
            >
              Descargar PDF
            </button>
          </>
        )}
      </main>
    </section>
  );
}

export default AdminReserva;
