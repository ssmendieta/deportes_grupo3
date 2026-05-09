import { useEffect, useState } from "react";
import { apiRequest } from "../../../shared/services/apiClient";
import type { PagoFiltro } from "../types/pago.types";

type DisciplinaOpcion = { id: number; nombre: string };

type Props = {
  filtros: PagoFiltro;
  onChange: (filtros: PagoFiltro) => void;
};

function PagosFilters({ filtros, onChange }: Props) {
  const [disciplinas, setDisciplinas] = useState<DisciplinaOpcion[]>([]);

  useEffect(() => {
    apiRequest<DisciplinaOpcion[]>("/api/disciplinas?activo=true", {
      requiresAdmin: true,
    })
      .then(setDisciplinas)
      .catch(() => setDisciplinas([]));
  }, []);

  return (
    <section className="panel-card filters-grid">
      <label className="field">
        <span>Buscar por nombre o CI</span>
        <input
          value={filtros.busqueda}
          onChange={(e) => onChange({ ...filtros, busqueda: e.target.value })}
          placeholder="Buscar..."
        />
      </label>

      <label className="field">
        <span>Disciplina</span>
        <select
          value={filtros.disciplinaId}
          onChange={(e) =>
            onChange({
              ...filtros,
              disciplinaId:
                e.target.value === "todas" ? "todas" : Number(e.target.value),
            })
          }
        >
          <option value="todas">Todas</option>
          {disciplinas.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Estado</span>
        <select
          value={filtros.estado}
          onChange={(e) =>
            onChange({
              ...filtros,
              estado: e.target.value as PagoFiltro["estado"],
            })
          }
        >
          <option value="todos">Todos</option>
          <option value="al_dia">Al día</option>
          <option value="pendiente">Pendiente</option>
        </select>
      </label>
    </section>
  );
}

export default PagosFilters;
