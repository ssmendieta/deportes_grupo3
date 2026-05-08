import StatusBadge from "../../../shared/components/StatusBadge";
import { formatFechaBO } from "../../../shared/services/apiClient";
import type { Deportista, EstadoCuenta } from "../types/deportista.types";

type Props = {
  deportista: Deportista;
  onVolver: () => void;
};

const estadoLabel: Record<EstadoCuenta, string> = {
  al_dia: "Al día",
  pendiente: "Pendiente",
  moroso: "Moroso",
  exonerado: "Exonerado/Beca",
};

function DeportistaAccount({ deportista, onVolver }: Props) {
  return (
    <div className="page-stack">
      <div className="inline-actions"><button className="btn btn-ghost" onClick={onVolver}>← Volver</button></div>

      <section className="panel-card detail-panel wide">
        <div className="detail-header">
          <div>
            <span className="section-label">Cuenta del deportista</span>
            <h2>{deportista.nombreCompleto}</h2>
            <p>{deportista.disciplina} · {deportista.categoria}</p>
          </div>
          <StatusBadge tone={deportista.estadoCuenta === "al_dia" ? "success" : deportista.estadoCuenta === "moroso" ? "danger" : "warning"}>{estadoLabel[deportista.estadoCuenta]}</StatusBadge>
        </div>

        <div className="info-grid">
          <div><span>CI</span><strong>{deportista.ci}</strong></div>
          <div><span>Teléfono</span><strong>{deportista.telefono || "Sin registro"}</strong></div>
          <div><span>Correo</span><strong>{deportista.email || "Sin registro"}</strong></div>
          <div><span>Carrera / Semestre</span><strong>{deportista.carrera || "-"} · {deportista.semestre || "-"}</strong></div>
          <div><span>Tipo</span><strong>{deportista.tipo}</strong></div>
          <div><span>Nivel</span><strong>{deportista.nivel}</strong></div>
          <div><span>Matrícula</span><strong>{deportista.matriculaActiva ? "Activa" : "No activa"}</strong></div>
          <div><span>Deuda actual</span><strong>Bs. {deportista.deuda}</strong></div>
          <div className="full"><span>Dirección</span><strong>{deportista.direccion || "Sin registro"}</strong></div>
        </div>
      </section>

      <section className="panel-card">
        <div className="section-heading">
          <span>Historial extendido</span>
          <h2>Pagos por mes</h2>
        </div>
        <div className="table-card embedded">
          <table className="data-table">
            <thead><tr><th>Mes</th><th>Año</th><th>Concepto</th><th>Monto</th><th>Estado</th><th>Fecha pago</th><th>Observaciones</th></tr></thead>
            <tbody>
              {deportista.historialPagos.map((pago) => (
                <tr key={pago.id}>
                  <td>{pago.mes}</td><td>{pago.anio}</td><td>{pago.concepto}</td><td>Bs. {pago.monto}</td>
                  <td><StatusBadge tone={pago.estado === "al_dia" ? "success" : pago.estado === "moroso" ? "danger" : "warning"}>{estadoLabel[pago.estado]}</StatusBadge></td>
                  <td>{pago.fechaPago ? formatFechaBO(pago.fechaPago) : "-"}</td>
                  <td>{pago.observaciones || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default DeportistaAccount;
