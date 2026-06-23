import { CAMPOS_MESES_PAGADO, TIPOS_NO_APLICA_PAGO } from "../constants/business.constants";

export type PlanillaParaEstado = {
  matricula_pagada: boolean;
  mes_1_pagado: boolean;
  mes_2_pagado: boolean;
  mes_3_pagado: boolean;
  mes_4_pagado: boolean;
  mes_5_pagado: boolean;
  mes_6_pagado: boolean;
  mes_7_pagado: boolean;
  mes_8_pagado: boolean;
  mes_9_pagado: boolean;
  saldo_pendiente: number;
};

export type PlanillaVistaRow = PlanillaParaEstado & {
  deportista_id: number;
  nombre_completo: string;
  tipo_deportista: string;
};

export type EstadoCuentaResult = {
  estado_cuenta: "al_dia" | "pendiente" | "no_aplica";
  deuda: number;
};

/**
 * Calcula el estado de cuenta de un deportista a partir de su tipo y su planilla.
 *
 * El año académico empieza en marzo (mes calendario 3) y termina en
 * septiembre (mes calendario 9). Los meses vencidos son los meses calendario
 * transcurridos desde marzo hasta el mes anterior al actual, sin pasarse de
 * septiembre.
 *
 * Ejemplos:
 * - Abril: vence marzo (mes 3).
 * - Mayo: vencen marzo y abril (meses 3 y 4).
 * - Junio: vencen marzo, abril y mayo (meses 3, 4 y 5).
 *
 * Nota: se mantiene la misma lógica tanto para PagosService como para
 * DeportistasService, eliminando la duplicación y evitando resultados
 * inconsistentes entre módulos.
 */
export function calcularEstadoCuenta(
  tipoDeportista: string,
  planilla: PlanillaParaEstado | null | undefined,
  ahora: Date = new Date(),
): EstadoCuentaResult {
  if (TIPOS_NO_APLICA_PAGO.includes(tipoDeportista)) {
    return { estado_cuenta: "no_aplica", deuda: 0 };
  }

  if (!planilla) {
    return { estado_cuenta: "pendiente", deuda: 0 };
  }

  // getMonth() es 0-indexado: enero=0, febrero=1, marzo=2, ...
  const mesCalendarioActual = ahora.getMonth() + 1;

  // Los meses vencidos son marzo (3) hasta el mes anterior al actual,
  // limitado a septiembre (9) porque el año académico termina ahí.
  const mesesVencidos: number[] = [];
  for (let m = 3; m <= Math.min(mesCalendarioActual - 1, 9); m++) {
    mesesVencidos.push(m);
  }

  const todosMesesPagados = mesesVencidos.every(
    (m) => planilla[`mes_${m}_pagado` as keyof PlanillaParaEstado],
  );
  const todoAlDia = todosMesesPagados && planilla.matricula_pagada;

  if (todoAlDia) {
    return { estado_cuenta: "al_dia", deuda: 0 };
  }

  return {
    estado_cuenta: "pendiente",
    deuda: Number(planilla.saldo_pendiente ?? 0),
  };
}
