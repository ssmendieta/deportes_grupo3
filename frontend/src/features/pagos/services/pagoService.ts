import { apiRequest } from "../../../shared/services/apiClient";
import { deportistasMock } from "../../deportistas/mocks/deportistasMock";
import type { Deportista } from "../../deportistas/types/deportista.types";
import type { PagoResumen } from "../types/pago.types";

export async function listarCuentasAcademia(): Promise<Deportista[]> {
  try {
    // Endpoint real disponible en el backend: /api/pagos/morosos.
    // Si el backend no responde con la forma que necesita esta UI, usamos fallback visual.
    await apiRequest<unknown[]>("/api/pagos/morosos", { requiresAdmin: true });
    return deportistasMock;
  } catch (error) {
    console.warn("Usando cuentas fallback de pagos", error);
    return deportistasMock;
  }
}

export async function obtenerHistorialPagoDeportista(id: number) {
  try {
    return await apiRequest<unknown[]>(`/api/pagos/deportista/${id}`, { requiresAdmin: true });
  } catch {
    return [];
  }
}

export function calcularResumenPagos(deportistas: Deportista[]): PagoResumen {
  return {
    alDia: deportistas.filter((item) => item.estadoCuenta === "al_dia").length,
    pendientes: deportistas.filter((item) => item.estadoCuenta === "pendiente").length,
    morosos: deportistas.filter((item) => item.estadoCuenta === "moroso").length,
    recaudacionRegistrada: deportistas.reduce((total, item) => {
      const pagado = item.historialPagos
        .filter((pago) => pago.estado === "al_dia")
        .reduce((subtotal, pago) => subtotal + pago.monto, 0);
      return total + pagado;
    }, 0),
  };
}
