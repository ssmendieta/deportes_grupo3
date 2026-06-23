import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, ConflictException } from "@nestjs/common";
import { PagosService } from "./pagos.service";
import { PrismaService } from "../prisma/prisma.service";
import { mockPrisma, mockTx, resetPrismaMocks } from "../prisma/__mocks__/prisma.service";

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

  const planillaAlDia = {
    deportista_id: 1,
    gestion: 2026,
    matricula_pagada: true,
    mes_1_pagado: true,
    mes_2_pagado: true,
    mes_3_pagado: true,
    mes_4_pagado: true,
    mes_5_pagado: true,
    mes_6_pagado: true,
    mes_7_pagado: true,
    mes_8_pagado: true,
    mes_9_pagado: true,
    total_pagado: 1200,
    saldo_pendiente: 0,
  };

  const planillaPendiente = {
    deportista_id: 2,
    gestion: 2026,
    matricula_pagada: false,
    mes_1_pagado: false,
    mes_2_pagado: false,
    mes_3_pagado: false,
    mes_4_pagado: false,
    mes_5_pagado: false,
    mes_6_pagado: false,
    mes_7_pagado: false,
    mes_8_pagado: false,
    mes_9_pagado: false,
    total_pagado: 0,
    saldo_pendiente: 150,
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
  // findAllParaReporte
  // ========================
  describe("findAllParaReporte", () => {
    it("debe filtrar por rango de fecha en la base de datos", async () => {
      (mockPrisma.pagos as any).findMany.mockResolvedValue([pagoMock]);
      (mockPrisma.pagos as any).count.mockResolvedValue(1);

      const fechaDesde = new Date("2026-05-01");
      const fechaHasta = new Date("2026-06-01");
      const result = await service.findAllParaReporte({ fechaDesde, fechaHasta });

      expect(result.data).toHaveLength(1);
      expect((mockPrisma.pagos as any).findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fecha_pago: { gte: fechaDesde, lt: fechaHasta },
          }),
        }),
      );
    });
  });

  // ========================
  // getCuentasAcademia
  // ========================
  describe("getCuentasAcademia", () => {
    it("debe retornar cuentas paginadas sin filtros", async () => {
      (mockPrisma.deportistas as any).findMany
        .mockResolvedValueOnce([{ id_deportista: 1 }])
        .mockResolvedValueOnce([
          {
            id_deportista: 1,
            tipo_deportista: "academia",
            id_persona: 1,
            persona: { nombres: "Juan", ape_paterno: "Pérez", ape_materno: "", ci: 12345 },
            inscripciones: [],
          },
        ]);
      (mockPrisma.$queryRaw as any).mockResolvedValue([planillaAlDia]);

      const result = await service.getCuentasAcademia({});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].estadoCuenta).toBe("al_dia");
    });

    it("debe filtrar por estado pendiente", async () => {
      (mockPrisma.deportistas as any).findMany
        .mockResolvedValueOnce([
          { id_deportista: 1 },
          { id_deportista: 2 },
        ])
        .mockResolvedValueOnce([
          {
            id_deportista: 2,
            tipo_deportista: "academia",
            id_persona: 2,
            persona: { nombres: "Ana", ape_paterno: "Gómez", ape_materno: "", ci: 54321 },
            inscripciones: [],
          },
        ]);
      (mockPrisma.$queryRaw as any).mockResolvedValue([planillaPendiente]);

      const result = await service.getCuentasAcademia({ estado: "pendiente" });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(2);
      expect(result.data[0].estadoCuenta).toBe("pendiente");
    });

    it("debe filtrar por mes y descartar deportistas que no cumplan", async () => {
      const planillaHastaAbril = {
        ...planillaAlDia,
        mes_3_pagado: true,
        mes_4_pagado: true,
        mes_5_pagado: false,
      };
      (mockPrisma.deportistas as any).findMany.mockResolvedValue([
        { id_deportista: 1 },
      ]);
      (mockPrisma.$queryRaw as any).mockResolvedValue([planillaHastaAbril]);

      const result = await service.getCuentasAcademia({ mes: 5 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("debe buscar por CI exacto", async () => {
      (mockPrisma.personas as any).findUnique.mockResolvedValue({ id_persona: 7 });
      (mockPrisma.deportistas as any).findMany
        .mockResolvedValueOnce([{ id_deportista: 1 }])
        .mockResolvedValueOnce([
          {
            id_deportista: 1,
            tipo_deportista: "academia",
            id_persona: 7,
            persona: { nombres: "Juan", ape_paterno: "Pérez", ape_materno: "", ci: 12345 },
            inscripciones: [],
          },
        ]);
      (mockPrisma.$queryRaw as any).mockResolvedValue([planillaAlDia]);

      const result = await service.getCuentasAcademia({ busqueda: "12345" });

      expect((mockPrisma.personas as any).findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { ci: 12345 } }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0].ci).toBe("12345");
    });

    it("debe retornar vacío cuando la búsqueda por CI no es numérica", async () => {
      (mockPrisma.deportistas as any).findMany.mockResolvedValue([]);

      const result = await service.getCuentasAcademia({ busqueda: "abc" });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
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
      (mockPrisma.$queryRaw as any).mockResolvedValue([
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
      (mockPrisma.$queryRaw as any).mockResolvedValue([
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
      (mockTx.deportistas as any).findUnique.mockResolvedValue({ id_deportista: 1 });
      (mockTx.conceptos_pago as any).findUnique.mockResolvedValue({ id_concepto: 1 });
      (mockTx.personas as any).findUnique.mockResolvedValue({ id_persona: 1 });
      (mockTx.pagos as any).findFirst.mockResolvedValue(null);
      (mockTx.pagos as any).create.mockResolvedValue(pagoMock);

      const result = await service.registrarPago(dtoValido);

      expect(result.id_pago).toBe(1);
    });

    it("debe lanzar NotFoundException si el deportista no existe", async () => {
      (mockTx.deportistas as any).findUnique.mockResolvedValue(null);

      await expect(service.registrarPago(dtoValido)).rejects.toThrow(NotFoundException);
    });

    it("debe lanzar NotFoundException si el concepto no existe", async () => {
      (mockTx.deportistas as any).findUnique.mockResolvedValue({ id_deportista: 1 });
      (mockTx.conceptos_pago as any).findUnique.mockResolvedValue(null);

      await expect(service.registrarPago(dtoValido)).rejects.toThrow(NotFoundException);
    });

    it("debe lanzar ConflictException si ya existe pago para el mismo mes/anio", async () => {
      (mockTx.deportistas as any).findUnique.mockResolvedValue({ id_deportista: 1 });
      (mockTx.conceptos_pago as any).findUnique.mockResolvedValue({ id_concepto: 1 });
      (mockTx.personas as any).findUnique.mockResolvedValue({ id_persona: 1 });
      (mockTx.pagos as any).findFirst.mockResolvedValue({ id_pago: 5 });

      await expect(service.registrarPago(dtoValido)).rejects.toThrow(ConflictException);
    });
  });

  // ========================
  // anularPago
  // ========================
  describe("anularPago", () => {
    it("debe anular un pago exitosamente", async () => {
      (mockTx.pagos as any).findUnique.mockResolvedValue({
        id_pago: 1,
        estado_factura: "Activa",
      });
      (mockTx.pagos as any).update.mockResolvedValue({
        id_pago: 1,
        estado_factura: "Anulado",
      });

      const result = await service.anularPago(1);

      expect(result.estado_factura).toBe("Anulado");
    });

    it("debe lanzar NotFoundException si el pago no existe", async () => {
      (mockTx.pagos as any).findUnique.mockResolvedValue(null);

      await expect(service.anularPago(999)).rejects.toThrow(NotFoundException);
    });

    it("debe lanzar ConflictException si el pago ya esta anulado", async () => {
      (mockTx.pagos as any).findUnique.mockResolvedValue({
        id_pago: 1,
        estado_factura: "Anulado",
      });

      await expect(service.anularPago(1)).rejects.toThrow(ConflictException);
    });
  });
});
