import type { Disciplina } from "../types/disciplina.types";
import EstadoDisciplinaBadge from "./EstadoDisciplinaBadge";

type Props = {
  disciplinas: Disciplina[];
  cargando: boolean;
  onEditar: (disciplina: Disciplina) => void;
  onCambiarEstado: (disciplina: Disciplina) => void;
};

function DisciplinaTable({
  disciplinas,
  cargando,
  onEditar,
  onCambiarEstado,
}: Props) {
  if (cargando)
    return <div className="panel-card">Cargando disciplinas...</div>;

  return (
    <div className="table-card">
      <table className="data-table">
        <thead>
          <tr>
            <th>Disciplina</th>
            <th>Categorías</th>
            <th>Mensualidad</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {disciplinas.map((disciplina) => (
            <tr key={disciplina.id}>
              <td>
                <strong>{disciplina.nombre}</strong>
                <span>{disciplina.descripcion || "Sin descripción"}</span>
              </td>
              <td>{disciplina.categorias || "—"}</td>
              <td>Bs. {disciplina.mensualidad}</td>
              <td>
                <EstadoDisciplinaBadge estado={disciplina.estado} />
              </td>
              <td>
                <div className="actions-row">
                  <button
                    className="btn btn-outline small"
                    onClick={() => onEditar(disciplina)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-ghost small"
                    onClick={() => onCambiarEstado(disciplina)}
                  >
                    {disciplina.estado === "activa" ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DisciplinaTable;
