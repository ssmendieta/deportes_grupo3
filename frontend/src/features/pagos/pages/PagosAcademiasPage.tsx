import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../../shared/components/PageHeader";
import StatCard from "../../../shared/components/StatCard";
import DeportistaAccount from "../../deportistas/components/DeportistaAccount";
import DeportistaTable from "../../deportistas/components/DeportistaTable";
import type { Deportista } from "../../deportistas/types/deportista.types";
import PagosFilters from "../components/PagosFilters";
import PagosLegend from "../components/PagosLegend";
import { calcularResumenPagos, listarCuentasAcademia } from "../services/pagoService";
import type { PagoFiltro } from "../types/pago.types";

const filtrosIniciales: PagoFiltro = {
  busqueda: "",
  disciplina: "Todas",
  categoria: "Todas",
  mes: "Todos",
  estado: "todos",
  tipo: "todos",
};

function PagosAcademiasPage() {
  const [cuentas, setCuentas] = useState<Deportista[]>([]);
  const [filtros, setFiltros] = useState<PagoFiltro>(filtrosIniciales);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<Deportista | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void listarCuentasAcademia().then(setCuentas); }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const resumen = useMemo(() => calcularResumenPagos(cuentas), [cuentas]);

  const cuentasFiltradas = useMemo(() => {
    return cuentas.filter((item) => {
      const coincideBusqueda = `${item.nombreCompleto} ${item.ci}`.toLowerCase().includes(filtros.busqueda.toLowerCase());
      const coincideDisciplina = filtros.disciplina === "Todas" || item.disciplina === filtros.disciplina;
      const coincideCategoria = filtros.categoria === "Todas" || item.categoria === filtros.categoria;
      const coincideMes = filtros.mes === "Todos" || item.mesActual === filtros.mes;
      const coincideEstado = filtros.estado === "todos" || item.estadoCuenta === filtros.estado;
      return coincideBusqueda && coincideDisciplina && coincideCategoria && coincideMes && coincideEstado;
    });
  }, [cuentas, filtros]);

  if (cuentaSeleccionada) {
    return <DeportistaAccount deportista={cuentaSeleccionada} onVolver={() => setCuentaSeleccionada(null)} />;
  }

  return (
    <div className="page-stack">
      <PageHeader title="Verificación de pagos de academias" description="Consulta estados de cuenta, morosidad y pagos registrados por deportista." />

      <section className="stats-grid">
        <StatCard label="Al día" value={resumen.alDia} tone="green" helper="deportistas" />
        <StatCard label="Pendientes" value={resumen.pendientes} tone="yellow" helper="deportistas" />
        <StatCard label="Morosos" value={resumen.morosos} tone="red" helper="deportistas" />
        <StatCard label="Recaudación registrada" value={`Bs. ${resumen.recaudacionRegistrada}`} />
      </section>

      <PagosFilters filtros={filtros} onChange={setFiltros} />
      <PagosLegend />
      <DeportistaTable deportistas={cuentasFiltradas} onVerCuenta={setCuentaSeleccionada} />
    </div>
  );
}

export default PagosAcademiasPage;
