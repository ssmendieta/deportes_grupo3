export const mockTx = {
  reserva: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  reservas: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  pago: {
    create: jest.fn(),
    update: jest.fn(),
  },
  pagos: {
    create: jest.fn(),
    update: jest.fn(),
  },
  deportista: {
    create: jest.fn(),
  },
  deportistas: {
    create: jest.fn(),
  },
  inscripcion: {
    create: jest.fn(),
  },
  inscripciones: {
    create: jest.fn(),
  },
  plantilla_horarios_fijos: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  espacios: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
};

export const mockPrisma = {
  reserva: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  reservas: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  espacio: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  espacios: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  disciplina: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  disciplinas: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  horarioDisponible: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  plantilla_horarios_fijos: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  deportista: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  deportistas: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  pago: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  pagos: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  conceptoPago: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  conceptos_pago: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  inscripcion: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  inscripciones: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  personas: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  usuarios: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
  auditoria: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
  transaccion_sync: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
  $queryRawUnsafe: jest.fn(),
  $queryRaw: jest.fn(),
};

export function resetPrismaMocks() {
  const reset = (obj: Record<string, unknown>) => {
    for (const v of Object.values(obj)) {
      if (typeof v === "function" && "mockReset" in v) {
        (v as jest.Mock).mockReset();
      }
    }
  };
  reset(mockPrisma);
  reset(mockTx);
  mockPrisma.$transaction.mockImplementation((cb: (tx: any) => any, _options?: any) => cb(mockTx));
}
