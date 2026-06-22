import type { EstadoCuenta, PlanillaEntry } from "../../deportistas/types/deportista.types";

export type CuentaAcademiaItem = {
  id: number;
  nombreCompleto: string;
  ci: string;
  tipo: string;
  inscripciones: { activo: boolean; disciplinaId: number; disciplinaNombre: string | null }[];
  estadoCuenta: string;
  deuda: number;
  planilla: PlanillaEntry | null;
};

export type PagoResumen = {
  alDia: number;
  pendientes: number;
};

export type PagoFiltro = {
  busqueda: string;

  disciplinaId:
    | number
    | "todas";

  estado:
    | "todos"
    | EstadoCuenta;

  // NUEVOS FILTROS
  mes: string;

  anio: string;
};