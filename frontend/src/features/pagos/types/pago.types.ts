import type { EstadoCuenta } from "../../deportistas/types/deportista.types";

export type PagoResumen = {
  alDia: number;

  pendientes: number;

  recaudacionRegistrada: number;
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