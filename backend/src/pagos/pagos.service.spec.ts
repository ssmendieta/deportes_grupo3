import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, ConflictException } from "@nestjs/common";
import { PagosService } from "./pagos.service";
import { PrismaService } from "../prisma/prisma.service";
import { mockPrisma, resetPrismaMocks } from "../prisma/__mocks__/prisma.service";

describe("PagosService", () => {
  let service: PagosService;

  beforeEach(async () => {
    resetPrismaMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagosService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PagosService>(PagosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ========================
  // findAll
  // ========================
  describe("findAll", () => {
    it("debe retornar lista de pagos", async () => {
      mockPrisma.pago.findMany.mockResolvedValue([{ id: 1, monto: 120, concepto: { nombre: "Mensualidad" } }]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(mockPrisma.pago.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ include: { concepto: true } }),
      );
    });
  });

  // ========================
  // getConceptos
  // ========================
  describe("getConceptos", () => {
    it("debe retornar conceptos de pago", async () => {
      mockPrisma.conceptoPago.findMany.mockResolvedValue([{ id: 1, nombre: "Mensualidad" }]);

      const result = await service.getConceptos();

      expect(result).toHaveLength(1);
    });

    it("debe filtrar por disciplina", async () => {
      mockPrisma.conceptoPago.findMany.mockResolvedValue([]);

      await service.getConceptos(1);

      expect(mockPrisma.conceptoPago.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ disciplina_id: 1 }),
        }),
      );
    });
  });

  // ========================
  // getPlanilla
  // ========================
  describe("getPlanilla", () => {
    it("debe retornar planilla de pagos", async () => {
      mockPrisma.inscripcion.findMany.mockResolvedValue([
        {
          deportista_id: 1,
          deportista: { id: 1, nombre_completo: "Juan", ci: "123", tipo: "academia" },
        },
      ]);
      mockPrisma.planillaPagosAcademia.findMany.mockResolvedValue([
        { deportista_id: 1, anio: 2026, matricula_pagada: true, mes_1_pagado: true },
      ]);

      const result = await service.getPlanilla(1, 2026);

      expect(result).toHaveLength(1);
      expect(result[0].deportista.nombre_completo).toBe("Juan");
    });
  });

  // ========================
  // getMorosos
  // ========================
  describe("getMorosos", () => {
    it("debe retornar lista de morosos", async () => {
      mockPrisma.planillaPagosAcademia.findMany.mockResolvedValue([
        {
          deportista_id: 1,
          matricula_pagada: false,
          mes_1_pagado: false,
          saldo_pendiente: 120,
          deportista: {
            nombre_completo: "Juan",
            ci: "123",
            inscripciones: [
              { disciplina: { nombre: "Fútsal" } },
            ],
          },
        },
      ]);

      const result = await service.getMorosos();

      expect(result).toHaveLength(1);
      expect(result[0].saldo_pendiente).toBe(120);
    });
  });

  // ========================
  // getPagosDeportista
  // ========================
  describe("getPagosDeportista", () => {
    it("debe retornar pagos de un deportista", async () => {
      mockPrisma.deportista.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.pago.findMany.mockResolvedValue([{ id: 1, monto: 120 }]);

      const result = await service.getPagosDeportista(1);

      expect(result).toHaveLength(1);
    });

    it("debe lanzar NotFoundException si el deportista no existe", async () => {
      mockPrisma.deportista.findUnique.mockResolvedValue(null);

      await expect(service.getPagosDeportista(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ========================
  // registrarPago
  // ========================
  describe("registrarPago", () => {
    const dtoValido = {
      deportista_id: 1,
      concepto_id: 1,
      monto: 120,
      fecha_pago: "2026-05-20",
      mes: 3,
      anio: 2026,
    };

    it("debe registrar un pago exitosamente", async () => {
      mockPrisma.deportista.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.conceptoPago.findUnique.mockResolvedValue({ id: 1, nombre: "Mensualidad" });
      mockPrisma.pago.findFirst.mockResolvedValue(null);
      mockPrisma.$transaction = jest.fn((cb: (tx: any) => any) =>
        cb({
          pago: { create: jest.fn().mockResolvedValue({ id: 1, ...dtoValido }) },
          planillaPagosAcademia: { upsert: jest.fn() },
        }),
      );

      const result = await service.registrarPago(dtoValido);

      expect(result.id).toBe(1);
    });

    it("debe lanzar NotFoundException si el deportista no existe", async () => {
      mockPrisma.deportista.findUnique.mockResolvedValue(null);

      await expect(service.registrarPago(dtoValido)).rejects.toThrow(NotFoundException);
    });

    it("debe lanzar NotFoundException si el concepto no existe", async () => {
      mockPrisma.deportista.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.conceptoPago.findUnique.mockResolvedValue(null);

      await expect(service.registrarPago(dtoValido)).rejects.toThrow(NotFoundException);
    });

    it("debe lanzar ConflictException si ya existe pago para el mismo mes/anio", async () => {
      mockPrisma.deportista.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.conceptoPago.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.pago.findFirst.mockResolvedValue({ id: 5 });

      await expect(service.registrarPago(dtoValido)).rejects.toThrow(ConflictException);
    });
  });

  // ========================
  // anularPago
  // ========================
  describe("anularPago", () => {
    it("debe anular un pago exitosamente", async () => {
      mockPrisma.pago.findUnique.mockResolvedValue({ id: 1, estado: "confirmado", monto: 120, mes: 3, anio: 2026, deportista_id: 1 });
      mockPrisma.$transaction = jest.fn((cb: (tx: any) => any) =>
        cb({
          pago: { update: jest.fn().mockResolvedValue({ id: 1, estado: "anulado" }) },
          planillaPagosAcademia: { updateMany: jest.fn() },
        }),
      );

      const result = await service.anularPago(1);

      expect(result.estado).toBe("anulado");
    });

    it("debe lanzar NotFoundException si el pago no existe", async () => {
      mockPrisma.pago.findUnique.mockResolvedValue(null);

      await expect(service.anularPago(999)).rejects.toThrow(NotFoundException);
    });

    it("debe lanzar ConflictException si el pago ya esta anulado", async () => {
      mockPrisma.pago.findUnique.mockResolvedValue({ id: 1, estado: "anulado" });

      await expect(service.anularPago(1)).rejects.toThrow(ConflictException);
    });
  });
});
