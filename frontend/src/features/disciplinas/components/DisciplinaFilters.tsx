import type { FiltroEstadoDisciplina } from "../types/disciplina.types";

type Props = {
  busqueda: string;
  filtroEstado: FiltroEstadoDisciplina;
  onBusquedaChange: (value: string) => void;
  onFiltroEstadoChange: (value: FiltroEstadoDisciplina) => void;
};

function DisciplinaFilters({ busqueda, filtroEstado, onBusquedaChange, onFiltroEstadoChange }: Props) {
  return (
    <section className="panel-card filters-grid two">
      <label className="field">
        <span>Buscador</span>
        <input value={busqueda} onChange={(e) => onBusquedaChange(e.target.value)} placeholder="Buscar disciplina..." />
      </label>
      <label className="field">
        <span>Filtro: activas/inactivas</span>
        <select value={filtroEstado} onChange={(e) => onFiltroEstadoChange(e.target.value as FiltroEstadoDisciplina)}>
          <option value="todas">Todas</option>
          <option value="activas">Activas</option>
          <option value="inactivas">Inactivas</option>
        </select>
      </label>
    </section>
  );
}

export default DisciplinaFilters;
