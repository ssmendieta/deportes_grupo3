import StatusBadge from "../../../shared/components/StatusBadge";
import type { Deportista, EstadoCuenta } from "../types/deportista.types";

type Props = {
  deportistas: Deportista[];
  onVerCuenta: (deportista: Deportista) => void;
};

const estadoLabel: Record<EstadoCuenta, string> = {
  al_dia: "✓ Al día",
  pendiente: "Pendiente",
  no_aplica: "No aplica",
};

const estadoTone: Record<EstadoCuenta, "success" | "warning" | "info"> = {
  al_dia: "success",
  pendiente: "warning",
  no_aplica: "info",
};

function DeportistaTable({ deportistas, onVerCuenta }: Props) {
  return (
    <div className="table-card">
      <table className="data-table">
        <thead>
          <tr>
            <th>Deportista</th>
            <th>CI</th>
            <th>Disciplina</th>
            <th>Mes actual</th>
            <th>Estado</th>
            <th>Deuda</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {deportistas.map((item) => {
            const inscripcionActiva = item.inscripciones?.find((i) => i.activo);
            const disciplinaNombre =
              inscripcionActiva?.disciplina?.nombre ?? "—";

            const estado: EstadoCuenta = item.estadoCuenta ?? "pendiente";
            const deuda = item.deuda ?? 0;

            const mesActual = new Date().toLocaleString("es-BO", {
              month: "long",
            });

            return (
              <tr key={item.id}>
                <td>
                  <strong>{item.nombreCompleto}</strong>
                  {item.carrera && <span>{item.carrera}</span>}
                </td>
                <td>{item.ci}</td>
                <td>{disciplinaNombre}</td>
                <td style={{ textTransform: "capitalize" }}>{mesActual}</td>
                <td>
                  <StatusBadge tone={estadoTone[estado]}>
                    {estadoLabel[estado]}
                  </StatusBadge>
                </td>
                <td>Bs. {deuda}</td>
                <td>
                  <button
                    className="btn btn-outline small"
                    onClick={() => onVerCuenta(item)}
                  >
                    Ver cuenta
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default DeportistaTable;
