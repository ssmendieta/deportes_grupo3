import { apiRequest } from "../../../shared/services/apiClient";
import type { Deportista } from "../../deportistas/types/deportista.types";
import type { CuentaAcademiaItem, PagoResumen } from "../types/pago.types";

export type CuentaAcademiaResponse = {
  data: CuentaAcademiaItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function listarCuentasAcademia(params?: {
  page?: number;
  limit?: number;
  busqueda?: string;
  disciplinaId?: number;
  mes?: number;
  anio?: number;
  estado?: string;
}): Promise<CuentaAcademiaResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.busqueda) query.set("busqueda", params.busqueda);
  if (params?.disciplinaId) query.set("disciplinaId", String(params.disciplinaId));
  if (params?.mes) query.set("mes", String(params.mes));
  if (params?.anio) query.set("anio", String(params.anio));
  if (params?.estado) query.set("estado", params.estado);

  const qs = query.toString();
  return apiRequest<CuentaAcademiaResponse>(`/api/pagos/cuentas-academia${qs ? `?${qs}` : ""}`, {
    requiresAuth: true,
  });
}

export function calcularResumenPagos(deportistas: Deportista[]): PagoResumen {
  return {
    alDia: deportistas.filter((d) => d.estadoCuenta === "al_dia").length,
    pendientes: deportistas.filter((d) => d.estadoCuenta === "pendiente").length,
  };
}


