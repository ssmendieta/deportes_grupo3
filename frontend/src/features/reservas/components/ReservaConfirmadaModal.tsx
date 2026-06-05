import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatFechaBO } from "../../../shared/services/apiClient";
import { descargarComprobanteReserva } from "../services/reservaService";
import type { Reserva } from "../types/reserva.types";

type Props = {
  reserva: Reserva | null;
  abierto: boolean;
  onCerrar: () => void;
};

function limpiarNombreArchivo(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ReservaConfirmadaModal({ reserva, abierto, onCerrar }: Props) {
  const navigate = useNavigate();
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState("");

  if (!abierto || !reserva) return null;

  const espacioNombre = reserva.espacio?.nombre || `Espacio #${reserva.espacio_id}`;
  const nombreArchivo = `comprobante-reserva-${limpiarNombreArchivo(
    reserva.nombre_solicitante,
  )}-${reserva.id}.pdf`;

  const handleDescargarPdf = async () => {
    setError("");
    setDescargando(true);

    try {
      await descargarComprobanteReserva(reserva.id, nombreArchivo);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo descargar el comprobante PDF.",
      );
    } finally {
      setDescargando(false);
    }
  };

  const handleCerrar = () => {
    onCerrar();
    navigate("/reservas");
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-card reserva-confirmada-modal" style={{ backgroundColor: "#fff" }}>
        <button
          type="button"
          className="modal-close"
          onClick={handleCerrar}
          aria-label="Cerrar modal de reserva confirmada"
        >
          ×
        </button>

        <span className="section-label">Reserva confirmada</span>
        <h2>Comprobante generado correctamente</h2>
        <p>
          Comprobante enviado a tu correo si lo proporcionaste. También puedes
          descargarlo ahora en formato PDF.
        </p>

        <div className="info-grid">
          <div>
            <span>ID de reserva</span>
            <strong>#{reserva.id}</strong>
          </div>

          <div>
            <span>Espacio</span>
            <strong>{espacioNombre}</strong>
          </div>

          <div>
            <span>Fecha</span>
            <strong>{formatFechaBO(reserva.fecha_reserva)}</strong>
          </div>

          <div>
            <span>Horario</span>
            <strong>
              {reserva.hora_inicio} - {reserva.hora_fin}
            </strong>
          </div>
        </div>

        {error && <div className="form-error full">{error}</div>}

        <div className="form-actions reserva-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDescargarPdf}
            disabled={descargando}
          >
            {descargando ? "Descargando..." : "Descargar PDF"}
          </button>

          <button type="button" className="btn btn-ghost" onClick={handleCerrar}>
            Cerrar
          </button>
        </div>
      </section>
    </div>
  );
}

export default ReservaConfirmadaModal;
