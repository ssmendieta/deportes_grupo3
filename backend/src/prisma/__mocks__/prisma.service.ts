export const mockTx = {
  reserva: {
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
  planillaPagosAcademia: {
    upsert: jest.fn(),
    updateMany: jest.fn(),
  },
  deportista: {
    create: jest.fn(),
  },
  inscripcion: {
    create: jest.fn(),
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
  espacio: {
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
  horarioDisponible: {
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
  planillaPagosAcademia: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
    updateMany: jest.fn(),
  },
  pago: {
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
  inscripcion: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn(),
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
  mockPrisma.$transaction.mockImplementation((cb: (tx: any) => any) => cb(mockTx));
}
