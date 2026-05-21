import {
  useEffect,
  useMemo,
  useState,
} from "react";

import PageHeader from "../../../shared/components/PageHeader";

import StatCard from "../../../shared/components/StatCard";

import DeportistaAccount from "../../deportistas/components/DeportistaAccount";

import DeportistaTable from "../../deportistas/components/DeportistaTable";

import type { Deportista } from "../../deportistas/types/deportista.types";

import PagosFilters from "../components/PagosFilters";

import PagosLegend from "../components/PagosLegend";

import {
  calcularResumenPagos,
  listarCuentasAcademia,
} from "../services/pagoService";

import type { PagoFiltro } from "../types/pago.types";

import { ExportarReporteButton } from "../../../shared/components/ExportarReporteButton";
import Spinner from "../../../shared/components/Spinner";

const filtrosIniciales: PagoFiltro = {
  busqueda: "",

  disciplinaId: "todas",

  estado: "todos",

  // NUEVOS FILTROS
 mes: "enero",
anio: "2026",
};

function PagosAcademiasPage() {
  const [cuentas, setCuentas] =
    useState<Deportista[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filtros, setFiltros] =
    useState<PagoFiltro>(
      filtrosIniciales
    );

  const [
    cuentaSeleccionada,
    setCuentaSeleccionada,
  ] =
    useState<Deportista | null>(
      null
    );

  useEffect(() => {
    setCargando(true);
    listarCuentasAcademia()
      .then(setCuentas)
      .catch(() => setError("Error al cargar los datos de pagos"))
      .finally(() => setCargando(false));
  }, []);

  const resumen = useMemo(
    () =>
      calcularResumenPagos(
        cuentas
      ),
    [cuentas]
  );

  const cuentasFiltradas =
    useMemo(() => {
      return cuentas.filter(
        (item) => {
          // BUSQUEDA
          const coincideBusqueda =
            `${item.nombreCompleto} ${item.ci}`
              .toLowerCase()
              .includes(
                filtros.busqueda.toLowerCase()
              );

          // DISCIPLINA
          const coincideDisciplina =
            filtros.disciplinaId ===
              "todas" ||
            item.inscripciones?.some(
              (i) =>
                i.activo &&
                i.disciplinaId ===
                  filtros.disciplinaId
            );

          // ESTADO
          const coincideEstado =
            filtros.estado ===
              "todos" ||
            item.estadoCuenta ===
              filtros.estado;

          const coincideMes =
            filtros.mes === "enero" || (item.estadoCuenta === "pendiente" && (item.deuda ?? 0) > 0);
          const coincideAnio =
            filtros.anio === "2026" || (item.estadoCuenta === "pendiente" && (item.deuda ?? 0) > 0);

          return (
            coincideBusqueda &&
            coincideDisciplina &&
            coincideEstado &&
            coincideMes &&
            coincideAnio
          );
        }
      );
    }, [cuentas, filtros]);

  if (
    cuentaSeleccionada
  ) {
    return (
      <DeportistaAccount
        deportista={
          cuentaSeleccionada
        }
        onVolver={() =>
          setCuentaSeleccionada(
            null
          )
        }
      />
    );
  }

  return (
    <div className="page-stack">

      {/* HEADER */}
      <div
        style={{
          display: "flex",

          justifyContent:
            "space-between",

          alignItems: "center",

          flexWrap: "wrap",

          gap: "16px",
        }}
      >
        <PageHeader
          title="Verificación de pagos de academias"
          description="Consulta estados de cuenta y pagos registrados por deportista."
        />

        <div
          style={{
            marginTop: "10px",
          }}
        >
          <ExportarReporteButton
            endpoint="/pagos/reporte"
            filtros={filtros}
            nombreArchivoBase="Reporte_Pagos_Academias_UCB"
          />
        </div>
      </div>

      {cargando && <Spinner texto="Cargando datos de pagos..." tamanio="lg" />}

      {error && (
        <section className="panel-card" style={{ textAlign: "center", padding: "2rem" }}>
          <p className="form-error">{error}</p>
        </section>
      )}

      {!cargando && !error && (
        <>
      <section className="stats-grid">
        <StatCard
          label="Al día"
          value={resumen.alDia}
          tone="green"
          helper="deportistas"
        />

        <StatCard
          label="Pendientes"
          value={resumen.pendientes}
          tone="yellow"
          helper="deportistas"
        />

        <StatCard
          label="Recaudación registrada"
          value={`Bs. ${resumen.recaudacionRegistrada}`}
        />
      </section>

      <PagosFilters
        filtros={filtros}
        onChange={setFiltros}
      />

      <PagosLegend />

      <DeportistaTable
        deportistas={
          cuentasFiltradas
        }
        cargando={cargando}
        onVerCuenta={
          setCuentaSeleccionada
        }
      />
        </>
      )}
    </div>
  );
}

export default PagosAcademiasPage;