import type { PagoFiltro } from "../types/pago.types";

type Props = {
  filtros: PagoFiltro;
  onChange: (filtros: PagoFiltro) => void;
};

function PagosFilters({ filtros, onChange }: Props) {
  return (
    <section className="panel-card filters-grid">
      <label className="field"><span>Buscar por nombre o CI</span><input value={filtros.busqueda} onChange={(e) => onChange({ ...filtros, busqueda: e.target.value })} placeholder="Buscar..." /></label>
      <label className="field"><span>Disciplina</span><select value={filtros.disciplina} onChange={(e) => onChange({ ...filtros, disciplina: e.target.value })}><option>Todas</option><option>Voleibol</option><option>Básquet</option><option>Fútbol</option></select></label>
      <label className="field"><span>Categoría</span><select value={filtros.categoria} onChange={(e) => onChange({ ...filtros, categoria: e.target.value })}><option>Todas</option><option>Mayores</option><option>Sub-14</option></select></label>
      <label className="field"><span>Mes</span><select value={filtros.mes} onChange={(e) => onChange({ ...filtros, mes: e.target.value })}><option>Todos</option><option>Abril</option><option>Mayo</option></select></label>
      <label className="field"><span>Estado</span><select value={filtros.estado} onChange={(e) => onChange({ ...filtros, estado: e.target.value as PagoFiltro["estado"] })}><option value="todos">Todos</option><option value="al_dia">Al día</option><option value="pendiente">Pendiente</option><option value="moroso">Moroso</option></select></label>
    </section>
  );
}

export default PagosFilters;
