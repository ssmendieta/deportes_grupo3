import { useEffect, useState } from "react";
import StatusBadge from "../../../shared/components/StatusBadge";
import { formatFechaBO } from "../../../shared/services/apiClient";
import { obtenerPagosDeportista } from "../services/deportistaService";
import type {
  Deportista,
  EstadoCuenta,
  PagoHistorial,
} from "../types/deportista.types";

type Props = {
  deportista: Deportista;
  onVolver: () => void;
};

const estadoLabel: Record<EstadoCuenta, string> = {
  al_dia: "Al día",
  pendiente: "Pendiente",
  no_aplica: "No aplica",
};

function DeportistaAccount({ deportista, onVolver }: Props) {
  const [pagos, setPagos] = useState<PagoHistorial[]>([]);
  const [cargandoPagos, setCargandoPagos] = useState(true);

  const inscripcionActiva = deportista.inscripciones?.find((i) => i.activo);
  const disciplinaNombre = inscripcionActiva?.disciplina?.nombre ?? "—";
  const categoriaNombre = inscripcionActiva?.categoria ?? "—";
  const nivelNombre = inscripcionActiva?.nivel ?? "—";

  // estadoCuenta y deuda ya vienen calculados del backend
  const estado: EstadoCuenta = deportista.estadoCuenta ?? "pendiente";

  useEffect(() => {
    obtenerPagosDeportista(deportista.id)
      .then(setPagos)
      .catch(() => setPagos([]))
      .finally(() => setCargandoPagos(false));
  }, [deportista.id]);

  return (
    <div className="page-stack">
      <div className="inline-actions">
        <button className="btn btn-ghost" onClick={onVolver}>
          ← Volver
        </button>
      </div>

      <section className="panel-card detail-panel wide">
        <div className="detail-header">
          <div>
            <span className="section-label">Cuenta del deportista</span>
            <h2>{deportista.nombreCompleto}</h2>
            <p>
              {disciplinaNombre} · {categoriaNombre}
            </p>
          </div>
          <StatusBadge
            tone={
              estado === "al_dia"
                ? "success"
                : estado === "no_aplica"
                  ? "info"
                  : "warning"
            }
          >
            {estadoLabel[estado]}
          </StatusBadge>
        </div>

        <div className="info-grid">
          <div>
            <span>CI</span>
            <strong>{deportista.ci}</strong>
          </div>
          <div>
            <span>Teléfono</span>
            <strong>{deportista.telefono || "Sin registro"}</strong>
          </div>
          <div>
            <span>Correo</span>
            <strong>{deportista.email || "Sin registro"}</strong>
          </div>
          <div>
            <span>Carrera / Semestre</span>
            <strong>
              {deportista.carrera || "—"} · {deportista.semestre || "—"}
            </strong>
          </div>
          <div>
            <span>Tipo</span>
            <strong>{deportista.tipo}</strong>
          </div>
          <div>
            <span>Nivel</span>
            <strong>{nivelNombre}</strong>
          </div>
          <div>
            <span>Matrícula</span>
            <strong>
              {deportista.matriculaActiva ? "Activa" : "No activa"}
            </strong>
          </div>
          <div>
            <span>Deuda actual</span>
            <strong>Bs. {deportista.deuda ?? 0}</strong>
          </div>
          <div className="full">
            <span>Dirección</span>
            <strong>{deportista.direccion || "Sin registro"}</strong>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="section-heading">
          <span>Historial extendido</span>
          <h2>Pagos por mes</h2>
        </div>

        {cargandoPagos ? (
          <p style={{ padding: "1rem" }}>Cargando historial...</p>
        ) : pagos.length === 0 ? (
          <p style={{ padding: "1rem" }}>Sin pagos registrados.</p>
        ) : (
          <div className="table-card embedded">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>Año</th>
                  <th>Concepto</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Fecha pago</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago.id}>
                    <td>{pago.mes}</td>
                    <td>{pago.anio}</td>
                    <td>{pago.concepto}</td>
                    <td>Bs. {pago.monto}</td>
                    <td>
                      <StatusBadge tone={pago.anulado ? "danger" : "success"}>
                        {pago.anulado ? "Anulado" : "Confirmado"}
                      </StatusBadge>
                    </td>
                    <td>
                      {pago.fechaPago ? formatFechaBO(pago.fechaPago) : "—"}
                    </td>
                    <td>{pago.observaciones || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default DeportistaAccount;
