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

  const pagoMock = {
    id_pago: 1,
    id_persona_pago: 1,
    id_deportista_beneficiario: 1,
    id_concepto: 1,
    id_transaccion_caja: "CAJA-001",
    monto_pagado: 120,
    fecha_pago: new Date("2026-05-20"),
    mes_correspondiente: 3,
    gestion: 2026,
    estado_factura: "Activa",
    conceptos_pago: { id_concepto: 1, nombre: "Mensualidad" },
  };

  // ========================
  // findAll
  // ========================
  describe("findAll", () => {
    it("debe retornar lista de pagos paginada", async () => {
      (mockPrisma.pagos as any).findMany.mockResolvedValue([pagoMock]);
      (mockPrisma.pagos as any).count.mockResolvedValue(1);

      const result = await service.findAll();

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  // ========================
  // getConceptos
  // ========================
  describe("getConceptos", () => {
    it("debe retornar conceptos de pago", async () => {
      (mockPrisma.conceptos_pago as any).findMany.mockResolvedValue([
        { id_concepto: 1, nombre: "Mensualidad" },
      ]);

      const result = await service.getConceptos();

      expect(result).toHaveLength(1);
    });

    it("debe filtrar por disciplina", async () => {
      (mockPrisma.conceptos_pago as any).findMany.mockResolvedValue([]);

      await service.getConceptos(1);

      expect((mockPrisma.conceptos_pago as any).findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id_disciplina: 1 }),
        }),
      );
    });
  });

  // ========================
  // getPlanilla
  // ========================
  describe("getPlanilla", () => {
    it("debe retornar planilla de pagos", async () => {
      (mockPrisma.inscripciones as any).findMany.mockResolvedValue([
        { id_deportista: 1, id_inscripcion: 1 },
      ]);
      (mockPrisma.planillaPagosAcademia as any).findMany.mockResolvedValue([
        { deportista_id: 1, gestion: 2026, matricula_pagada: true, mes_1_pagado: true },
      ]);

      const result = await service.getPlanilla(1, 2026);

      expect(result).toHaveLength(1);
    });
  });

  // ========================
  // getMorosos
  // ========================
  describe("getMorosos", () => {
    it("debe retornar lista de morosos", async () => {
      (mockPrisma.planillaPagosAcademia as any).findMany.mockResolvedValue([
        {
          deportista_id: 1,
          nombre_completo: "Juan Pérez",
          tipo_deportista: "academia",
          gestion: 2026,
          matricula_pagada: false,
          mes_1_pagado: false,
          mes_2_pagado: true,
          mes_3_pagado: false,
          mes_4_pagado: true,
          mes_5_pagado: true,
          mes_6_pagado: true,
          mes_7_pagado: true,
          mes_8_pagado: true,
          mes_9_pagado: true,
          total_pagado: 240,
          saldo_pendiente: 120,
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
      (mockPrisma.deportistas as any).findUnique.mockResolvedValue({ id_deportista: 1 });
      (mockPrisma.pagos as any).findMany.mockResolvedValue([pagoMock]);

      const result = await service.getPagosDeportista(1);

      expect(result).toHaveLength(1);
    });

    it("debe lanzar NotFoundException si el deportista no existe", async () => {
      (mockPrisma.deportistas as any).findUnique.mockResolvedValue(null);

      await expect(service.getPagosDeportista(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ========================
  // registrarPago
  // ========================
  describe("registrarPago", () => {
    const dtoValido = {
      id_persona_pago: 1,
      id_deportista_beneficiario: 1,
      id_concepto: 1,
      id_transaccion_caja: "CAJA-001",
      monto_pagado: 120,
      fecha_pago: "2026-05-20",
      mes_correspondiente: 3,
      gestion: 2026,
    };

    it("debe registrar un pago exitosamente", async () => {
      (mockPrisma.deportistas as any).findUnique.mockResolvedValue({ id_deportista: 1 });
      (mockPrisma.conceptos_pago as any).findUnique.mockResolvedValue({ id_concepto: 1 });
      (mockPrisma.personas as any).findUnique.mockResolvedValue({ id_persona: 1 });
      (mockPrisma.pagos as any).findFirst.mockResolvedValue(null);
      (mockPrisma.pagos as any).create.mockResolvedValue(pagoMock);

      const result = await service.registrarPago(dtoValido);

      expect(result.id).toBe(1);
    });

    it("debe lanzar NotFoundException si el deportista no existe", async () => {
      (mockPrisma.deportistas as any).findUnique.mockResolvedValue(null);

      await expect(service.registrarPago(dtoValido)).rejects.toThrow(NotFoundException);
    });

    it("debe lanzar NotFoundException si el concepto no existe", async () => {
      (mockPrisma.deportistas as any).findUnique.mockResolvedValue({ id_deportista: 1 });
      (mockPrisma.conceptos_pago as any).findUnique.mockResolvedValue(null);

      await expect(service.registrarPago(dtoValido)).rejects.toThrow(NotFoundException);
    });

    it("debe lanzar ConflictException si ya existe pago para el mismo mes/anio", async () => {
      (mockPrisma.deportistas as any).findUnique.mockResolvedValue({ id_deportista: 1 });
      (mockPrisma.conceptos_pago as any).findUnique.mockResolvedValue({ id_concepto: 1 });
      (mockPrisma.personas as any).findUnique.mockResolvedValue({ id_persona: 1 });
      (mockPrisma.pagos as any).findFirst.mockResolvedValue({ id_pago: 5 });

      await expect(service.registrarPago(dtoValido)).rejects.toThrow(ConflictException);
    });
  });

  // ========================
  // anularPago
  // ========================
  describe("anularPago", () => {
    it("debe anular un pago exitosamente", async () => {
      (mockPrisma.pagos as any).findUnique.mockResolvedValue({
        id_pago: 1,
        estado_factura: "Activa",
      });
      (mockPrisma.pagos as any).update.mockResolvedValue({
        id_pago: 1,
        estado_factura: "Anulado",
      });

      const result = await service.anularPago(1);

      expect(result.estado).toBe("Anulado");
    });

    it("debe lanzar NotFoundException si el pago no existe", async () => {
      (mockPrisma.pagos as any).findUnique.mockResolvedValue(null);

      await expect(service.anularPago(999)).rejects.toThrow(NotFoundException);
    });

    it("debe lanzar ConflictException si el pago ya esta anulado", async () => {
      (mockPrisma.pagos as any).findUnique.mockResolvedValue({
        id_pago: 1,
        estado_factura: "Anulado",
      });

      await expect(service.anularPago(1)).rejects.toThrow(ConflictException);
    });
  });
});
