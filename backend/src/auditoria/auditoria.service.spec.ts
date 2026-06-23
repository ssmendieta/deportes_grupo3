import { Test, TestingModule } from "@nestjs/testing";
import { AuditoriaService } from "./auditoria.service";
import { PrismaService } from "../prisma/prisma.service";
import { mockPrisma, resetPrismaMocks } from "../prisma/__mocks__/prisma.service";

describe("AuditoriaService", () => {
  let service: AuditoriaService;

  const auditDbMock = {
    id_auditoria: 1,
    fecha_auditoria: new Date("2025-06-20T10:00:00.000Z"),
    id_usuario: 3,
    accion: "CREAR",
    tabla: "reserva",
    registro_id: 42,
    datos_anteriores: null,
    datos_nuevos: { id: 42, estado: "confirmada" },
    ip_address: "192.168.1.1",
  };

  beforeEach(async () => {
    resetPrismaMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditoriaService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AuditoriaService>(AuditoriaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("debe retornar todos los registros paginados", async () => {
      (mockPrisma.auditoria as any).findMany.mockResolvedValue([auditDbMock]);
      (mockPrisma.auditoria as any).count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
      expect(result.data[0].tabla).toBe("reserva");
      expect(result.data[0].registro_id).toBe(42);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it("debe filtrar por entidad (tabla)", async () => {
      (mockPrisma.auditoria as any).findMany.mockResolvedValue([auditDbMock]);
      (mockPrisma.auditoria as any).count.mockResolvedValue(1);

      await service.findAll({ entidad: "pago" });

      expect((mockPrisma.auditoria as any).findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tabla: "pago" }) }),
      );
    });

    it("debe aplicar paginación correctamente", async () => {
      (mockPrisma.auditoria as any).findMany.mockResolvedValue([]);
      (mockPrisma.auditoria as any).count.mockResolvedValue(100);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(10);
      expect((mockPrisma.auditoria as any).findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });

    it("debe ordenar por fecha_auditoria descendente", async () => {
      (mockPrisma.auditoria as any).findMany.mockResolvedValue([]);
      (mockPrisma.auditoria as any).count.mockResolvedValue(0);

      await service.findAll({});

      expect((mockPrisma.auditoria as any).findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { fecha_auditoria: "desc" } }),
      );
    });
  });

  describe("registrar", () => {
    it("debe crear un registro de auditoría", async () => {
      (mockPrisma.auditoria as any).create.mockResolvedValue(auditDbMock);

      await service.registrar({
        id_usuario: 3,
        accion: "CREAR",
        tabla: "reserva",
        registro_id: 42,
        datos_nuevos: { id: 42, estado: "confirmada" },
        ip_address: "192.168.1.1",
      });

      expect((mockPrisma.auditoria as any).create).toHaveBeenCalledWith({
        data: {
          id_usuario: 3,
          accion: "CREAR",
          tabla: "reserva",
          registro_id: 42,
          datos_anteriores: undefined,
          datos_nuevos: { id: 42, estado: "confirmada" },
          ip_address: "192.168.1.1",
        },
      });
    });

    it("no debe lanzar error si la creación falla", async () => {
      (mockPrisma.auditoria as any).create.mockRejectedValue(new Error("DB error"));

      await expect(
        service.registrar({
          accion: "CREAR",
          tabla: "reserva",
          registro_id: 1,
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe("obtenerDatosAnteriores", () => {
    it("debe retornar datos anteriores de una entidad", async () => {
      const oldData = { id_reserva: 10, estado: "Pendiente", motivo: "test" };
      (mockPrisma.reservas as any).findUnique.mockResolvedValue(oldData);

      const result = await service.obtenerDatosAnteriores("reserva", 10);

      expect(result).toEqual(oldData);
      expect((mockPrisma.reservas as any).findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id_reserva: 10 } }),
      );
    });

    it("debe retornar null si no hay registro", async () => {
      (mockPrisma.reservas as any).findUnique.mockResolvedValue(null);

      const result = await service.obtenerDatosAnteriores("reserva", 999);

      expect(result).toBeNull();
    });

    it("debe retornar null para entidad desconocida", async () => {
      const result = await service.obtenerDatosAnteriores("unknown", 1);

      expect(result).toBeNull();
    });
  });

  describe("sanitizar", () => {
    it("debe ocultar campos sensibles al registrar", async () => {
      (mockPrisma.auditoria as any).create.mockResolvedValue(auditDbMock);

      await service.registrar({
        accion: "CREAR",
        tabla: "reserva",
        registro_id: 1,
        datos_nuevos: { id: 1, password: "secreto", estado: "ok" },
      });

      expect((mockPrisma.auditoria as any).create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            datos_nuevos: { id: 1, password: "***", estado: "ok" },
          }),
        }),
      );
    });
  });
});
