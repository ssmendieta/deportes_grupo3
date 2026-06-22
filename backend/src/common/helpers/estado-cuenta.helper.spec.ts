import { calcularEstadoCuenta, PlanillaParaEstado } from "./estado-cuenta.helper";

function planillaBase(overrides: Partial<PlanillaParaEstado> = {}): PlanillaParaEstado {
  return {
    matricula_pagada: true,
    mes_1_pagado: false,
    mes_2_pagado: false,
    mes_3_pagado: false,
    mes_4_pagado: false,
    mes_5_pagado: false,
    mes_6_pagado: false,
    mes_7_pagado: false,
    mes_8_pagado: false,
    mes_9_pagado: false,
    saldo_pendiente: 0,
    ...overrides,
  };
}

describe("calcularEstadoCuenta", () => {
  it("devuelve no_aplica para tipos exentos", () => {
    const result = calcularEstadoCuenta("exonerado", planillaBase({ saldo_pendiente: 100 }));
    expect(result).toEqual({ estado_cuenta: "no_aplica", deuda: 0 });
  });

  it("devuelve pendiente si no hay planilla", () => {
    const result = calcularEstadoCuenta("academia", null);
    expect(result).toEqual({ estado_cuenta: "pendiente", deuda: 0 });
  });

  it("en marzo solo exige matrícula", () => {
    const planilla = planillaBase({ matricula_pagada: true });
    const result = calcularEstadoCuenta("academia", planilla, new Date(2026, 2, 15));
    expect(result.estado_cuenta).toBe("al_dia");
    expect(result.deuda).toBe(0);
  });

  it("en abril exige marzo pagado", () => {
    const planilla = planillaBase({ mes_3_pagado: true, matricula_pagada: true });
    const result = calcularEstadoCuenta("academia", planilla, new Date(2026, 3, 15));
    expect(result.estado_cuenta).toBe("al_dia");
  });

  it("en mayo exige marzo y abril pagados", () => {
    const planilla = planillaBase({
      mes_3_pagado: true,
      mes_4_pagado: true,
      matricula_pagada: true,
    });
    const result = calcularEstadoCuenta("academia", planilla, new Date(2026, 4, 15));
    expect(result.estado_cuenta).toBe("al_dia");
  });

  it("en junio, pagado hasta abril está pendiente", () => {
    const planilla = planillaBase({
      mes_3_pagado: true,
      mes_4_pagado: true,
      matricula_pagada: true,
      saldo_pendiente: 80,
    });
    const result = calcularEstadoCuenta("academia", planilla, new Date(2026, 5, 15));
    expect(result.estado_cuenta).toBe("pendiente");
    expect(result.deuda).toBe(80);
  });

  it("en junio, pagado hasta mayo está al día", () => {
    const planilla = planillaBase({
      mes_3_pagado: true,
      mes_4_pagado: true,
      mes_5_pagado: true,
      matricula_pagada: true,
    });
    const result = calcularEstadoCuenta("academia", planilla, new Date(2026, 5, 15));
    expect(result.estado_cuenta).toBe("al_dia");
    expect(result.deuda).toBe(0);
  });

  it("marca pendiente si falta matrícula", () => {
    const planilla = planillaBase({ mes_3_pagado: true, matricula_pagada: false, saldo_pendiente: 50 });
    const result = calcularEstadoCuenta("academia", planilla, new Date(2026, 3, 15));
    expect(result.estado_cuenta).toBe("pendiente");
    expect(result.deuda).toBe(50);
  });
});
