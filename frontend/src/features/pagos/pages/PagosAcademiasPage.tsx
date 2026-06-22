import { useCallback, useEffect, useState } from "react";

import PageHeader from "../../../shared/components/PageHeader";
import DeportistaAccount from "../../deportistas/components/DeportistaAccount";
import DeportistaTable from "../../deportistas/components/DeportistaTable";
import type { Deportista } from "../../deportistas/types/deportista.types";
import PagosFilters from "../components/PagosFilters";
import { listarCuentasAcademia } from "../services/pagoService";
import type { CuentaAcademiaItem, PagoFiltro } from "../types/pago.types";
import { ExportarReporteButton } from "../../../shared/components/ExportarReporteButton";
import Spinner from "../../../shared/components/Spinner";

const LIMIT = 7;

const filtrosIniciales: PagoFiltro = {
  busqueda: "",
  disciplinaId: "todas",
  estado: "todos",
  mes: "todos",
  anio: new Date().getFullYear().toString(),
};

function PagosAcademiasPage() {
  const [cuentas, setCuentas] = useState<Deportista[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<PagoFiltro>(filtrosIniciales);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<Deportista | null>(null);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const cargarDatos = useCallback(async (pag: number, f: PagoFiltro) => {
    setCargando(true);
    setError(null);

    try {
      const params: Record<string, string | number> = { page: pag, limit: LIMIT };
      if (f.busqueda) params.busqueda = f.busqueda;
      if (f.disciplinaId !== "todas") params.disciplinaId = f.disciplinaId;
      if (f.mes !== "todos") params.mes = f.mes;
      if (f.anio !== "todos") params.anio = parseInt(f.anio);
      if (f.estado !== "todos") params.estado = f.estado;

      const res = await listarCuentasAcademia(params);

      setCuentas(res.data.map(mapItem));
      setPagina(res.page);
      setTotalPaginas(res.totalPages);
      setTotalItems(res.total);
    } catch {
      setError("Error al cargar los datos de pagos");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await cargarDatos(1, filtros);
    };
    load();
  }, [cargarDatos, filtros]);

  if (cuentaSeleccionada) {
    return (
      <DeportistaAccount
        deportista={cuentaSeleccionada}
        onVolver={() => setCuentaSeleccionada(null)}
      />
    );
  }

  const filtrosActivos =
    filtros.busqueda ||
    filtros.disciplinaId !== "todas" ||
    filtros.estado !== "todos" ||
    filtros.mes !== "todos" ||
    filtros.anio !== filtrosIniciales.anio;

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Universidad Católica Boliviana"
        title="Verificación de pagos de academias"
        description="Consulta estados de cuenta y pagos registrados por deportista."
      />

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        {filtrosActivos && (
          <button
            className="btn btn-danger"
            onClick={() => setFiltros(filtrosIniciales)}
            disabled={cargando}
          >
            ✕ Limpiar filtros
          </button>
        )}
        <ExportarReporteButton
          endpoint="/pagos/reporte"
          filtrosActuales={filtros}
          nombreArchivoBase="Reporte_Pagos_Academias_UCB"
          filtrosConfig={[
            { name: "mes", label: "Mes", type: "select", options: [
              { value: "", label: "Todos" },
              { value: "enero", label: "Enero" },
              { value: "febrero", label: "Febrero" },
              { value: "marzo", label: "Marzo" },
              { value: "abril", label: "Abril" },
              { value: "mayo", label: "Mayo" },
              { value: "junio", label: "Junio" },
              { value: "julio", label: "Julio" },
              { value: "agosto", label: "Agosto" },
              { value: "septiembre", label: "Septiembre" },
              { value: "octubre", label: "Octubre" },
              { value: "noviembre", label: "Noviembre" },
              { value: "diciembre", label: "Diciembre" },
            ]},
            { name: "anio", label: "Año", type: "select", options: [
              { value: "", label: "Todos" },
              { value: "2024", label: "2024" },
              { value: "2025", label: "2025" },
              { value: "2026", label: "2026" },
              { value: "2027", label: "2027" },
            ]},
          ]}
        />
      </div>

      <PagosFilters filtros={filtros} onChange={setFiltros} />

      {cargando && <Spinner texto="Cargando datos de pagos..." tamanio="lg" />}

      {error && (
        <section className="panel-card" style={{ textAlign: "center", padding: "2rem" }}>
          <p className="form-error">{error}</p>
        </section>
      )}

      {!cargando && !error && (
        <>
          <DeportistaTable
            deportistas={cuentas}
            cargando={cargando}
            onVerCuenta={setCuentaSeleccionada}
          />

          {totalPaginas > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "16px" }}>
              <button
                className="btn btn-ghost"
                disabled={pagina <= 1}
                onClick={() => cargarDatos(pagina - 1, filtros)}
              >
                ← Anterior
              </button>
              <span style={{ fontSize: "0.875rem", color: "#666" }}>
                Página {pagina} de {totalPaginas} ({totalItems} registros)
              </span>
              <button
                className="btn btn-ghost"
                disabled={pagina >= totalPaginas}
                onClick={() => cargarDatos(pagina + 1, filtros)}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function mapItem(item: CuentaAcademiaItem): Deportista {
  return {
    id: item.id,
    tipo: item.tipo as Deportista["tipo"],
    nombreCompleto: item.nombreCompleto,
    ci: item.ci,
    celular: "",
    activo: true,
    inscripciones: (item.inscripciones ?? []).map((i) => ({
      id: i.disciplinaId ?? 0,
      deportistaId: item.id,
      disciplinaId: i.disciplinaId,
      fechaInscripcion: "",
      activo: i.activo,
      disciplina: i.disciplinaNombre
        ? { id: i.disciplinaId, nombre: i.disciplinaNombre, activo: true }
        : undefined,
    })),
    estadoCuenta: item.estadoCuenta as Deportista["estadoCuenta"],
    deuda: item.deuda,
    planilla: item.planilla ?? undefined,
  };
}

export default PagosAcademiasPage;
