import StatusBadge from "../../../shared/components/StatusBadge";
import type { Deportista, EstadoCuenta } from "../types/deportista.types";

type Props = {
  deportistas: Deportista[];
  onVerCuenta: (deportista: Deportista) => void;
};

const estadoLabel: Record<EstadoCuenta, string> = {
  al_dia: "✓ Al día",
  pendiente: "⏰ Pendiente",
  moroso: "⚠ Moroso",
  exonerado: "★ Exonerado/Beca",
};

const estadoTone: Record<EstadoCuenta, "success" | "warning" | "danger" | "info"> = {
  al_dia: "success",
  pendiente: "warning",
  moroso: "danger",
  exonerado: "info",
};

function DeportistaTable({ deportistas, onVerCuenta }: Props) {
  return (
    <div className="table-card">
      <table className="data-table">
        <thead>
          <tr>
            <th>Deportista</th><th>CI</th><th>Disciplina</th><th>Mes actual</th><th>Estado</th><th>Deuda</th><th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {deportistas.map((item) => (
            <tr key={item.id}>
              <td><strong>{item.nombreCompleto}</strong><span>{item.carrera}</span></td>
              <td>{item.ci}</td>
              <td>{item.disciplina}</td>
              <td>{item.mesActual}</td>
              <td><StatusBadge tone={estadoTone[item.estadoCuenta]}>{estadoLabel[item.estadoCuenta]}</StatusBadge></td>
              <td>Bs. {item.deuda}</td>
              <td><button className="btn btn-outline small" onClick={() => onVerCuenta(item)}>Ver cuenta</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DeportistaTable;
