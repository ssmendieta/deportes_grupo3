import type { EstadoCuenta } from "../../deportistas/types/deportista.types";

export type PagoResumen = {
  alDia: number;
  pendientes: number;
  morosos: number;
  recaudacionRegistrada: number;
};

export type PagoFiltro = {
  busqueda: string;
  disciplina: string;
  categoria: string;
  mes: string;
  estado: "todos" | EstadoCuenta;
  tipo: "todos" | "academia" | "clase_libre" | "competitivo";
};
