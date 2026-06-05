import StatusBadge from "../../../shared/components/StatusBadge";
import Spinner from "../../../shared/components/Spinner";
import type { Deportista, EstadoCuenta } from "../types/deportista.types";

type Props = {
  deportistas: Deportista[];
  cargando?: boolean;
  onVerCuenta: (deportista: Deportista) => void;
  onEditar?: (deportista: Deportista) => void;
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

function nombreCompleto(d: Deportista) {
  return `${d.nombres ?? ""} ${d.apePaterno ?? ""} ${d.apeMaterno ?? ""}`.trim();
}

function ciCompleto(d: Deportista) {
  return d.complemento ? `${d.ci} ${d.complemento}` : d.ci;
}

function DeportistaTable({
  deportistas,
  cargando,
  onVerCuenta,
  onEditar,
}: Props) {
  if (cargando) {
    return <Spinner texto="Cargando deportistas..." tamanio="lg" />;
  }

  if (deportistas.length === 0) {
    return (
      <div
        className="panel-card"
        style={{ textAlign: "center", padding: "2rem" }}
      >
        No se encontraron deportistas.
      </div>
    );
  }

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
            <th>Acciones</th>
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
                  <strong>{nombreCompleto(item)}</strong>
                  {item.carrera && <span>{item.carrera}</span>}
                </td>
                <td>{ciCompleto(item)}</td>
                <td>{disciplinaNombre}</td>
                <td style={{ textTransform: "capitalize" }}>{mesActual}</td>
                <td>
                  <StatusBadge tone={estadoTone[estado]}>
                    {estadoLabel[estado]}
                  </StatusBadge>
                </td>
                <td>Bs. {deuda}</td>
                <td>
                  <div
                    style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                  >
                    <button
                      className="btn btn-outline small"
                      onClick={() => onVerCuenta(item)}
                    >
                      Ver cuenta
                    </button>
                    {onEditar && (
                      <button
                        className="btn btn-primary small"
                        onClick={() => onEditar(item)}
                      >
                        Editar
                      </button>
                    )}
                  </div>
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
