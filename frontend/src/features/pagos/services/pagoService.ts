import { listarDeportistas } from "../../deportistas/services/deportistaService";
import type { Deportista } from "../../deportistas/types/deportista.types";
import type { PagoResumen } from "../types/pago.types";

export async function listarCuentasAcademia(): Promise<Deportista[]> {
  const todos = await listarDeportistas();
  return todos.filter((d) => d.tipo === "academia");
}

export function calcularResumenPagos(deportistas: Deportista[]): PagoResumen {
  return {
    alDia: deportistas.filter((d) => d.estadoCuenta === "al_dia").length,
    pendientes: deportistas.filter((d) => d.estadoCuenta === "pendiente")
      .length,
    recaudacionRegistrada: deportistas.reduce(
      (total, d) => total + (d.deuda ?? 0),
      0,
    ),
  };
}
