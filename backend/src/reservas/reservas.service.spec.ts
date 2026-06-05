import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { ReservasService } from "./reservas.service";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { mockPrisma, mockTx, resetPrismaMocks } from "../prisma/__mocks__/prisma.service";

describe("ReservasService", () => {
  let service: ReservasService;

  const espacioMock = {
    id_espacio: 1,
    nombre_espacio: "Coliseo UCB",
    hora_apertura: new Date("1970-01-01T07:00:00.000Z"),
    horario_cierre: new Date("1970-01-01T22:00:00.000Z"),
    activo: true,
  };

  const reservaMock = {
    id_reserva: 1,
    id_espacio: 1,
    id_persona_aprobador: 1,
    fecha_reserva: new Date("2026-05-22T12:00:00.000Z"),
    hora_inicio: new Date("1970-01-01T14:00:00.000Z"),
    hora_fin: new Date("1970-01-01T16:00:00.000Z"),
    tipo_reserva: "entrenamiento",
    nombre_solicitante: "Juan Pérez",
    ci: 12345678,
    complemento: null,
    motivo: "Entrenamiento",
    estado: "confirmada",
    correo_solicitante: null,
    ruta_comprobante_pdf: null,
    espacios: { nombre_espacio: "Coliseo UCB" },
    personas: { nombres: "Admin", ape_paterno: "Sistema", ape_materno: null },
  };

  const mappedReserva = {
    id_reserva: 1,
    id_espacio: 1,
    id_persona_aprobador: 1,
    fecha_reserva: new Date("2026-05-22T12:00:00.000Z"),
    hora_inicio: "14:00",
    hora_fin: "16:00",
    tipo_reserva: "entrenamiento",
    motivo: "Entrenamiento",
    estado: "confirmada",
    ruta_comprobante_pdf: null,
    nombre_solicitante: "Juan Pérez",
    ci: 12345678,
    complemento: null,
    correo_solicitante: null,
    espacio_nombre: "Coliseo UCB",
    aprobador_nombre: "Admin Sistema",
  };

  beforeEach(async () => {
    resetPrismaMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservasService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: MailService,
          useValue: { sendReservaConfirmada: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ReservasService>(ReservasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ========================
  // findAll
  // ========================
  describe("findAll", () => {
    it("debe retornar lista paginada de reservas", async () => {
      (mockPrisma.reservas as any).findMany.mockResolvedValue([reservaMock]);
      (mockPrisma.reservas as any).count.mockResolvedValue(1);

      const result = await service.findAll();

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect((mockPrisma.reservas as any).findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 50 }),
      );
    });

    it("debe filtrar por espacioId", async () => {
      (mockPrisma.reservas as any).findMany.mockResolvedValue([]);
      (mockPrisma.reservas as any).count.mockResolvedValue(0);

      await service.findAll(1);

      expect((mockPrisma.reservas as any).findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id_espacio: 1 }),
        }),
      );
    });

    it("debe aplicar paginacion correctamente", async () => {
      (mockPrisma.reservas as any).findMany.mockResolvedValue([]);
      (mockPrisma.reservas as any).count.mockResolvedValue(0);

      await service.findAll(undefined, undefined, 2, 10);

      expect((mockPrisma.reservas as any).findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });
  });

  // ========================
  // findOne
  // ========================
  describe("findOne", () => {
    it("debe retornar una reserva por ID", async () => {
      (mockPrisma.reservas as any).findUnique.mockResolvedValue(reservaMock);

      const result = await service.findOne(1);

      expect(result.id_reserva).toBe(1);
      expect((mockPrisma.reservas as any).findUnique).toHaveBeenCalledWith({
        where: { id_reserva: 1 },
        include: { espacios: true, personas: true },
      });
    });

    it("debe lanzar NotFoundException si la reserva no existe", async () => {
      (mockPrisma.reservas as any).findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ========================
  // create
  // ========================
  describe("create", () => {
    const dtoValido = {
      espacio_id: 1,
      fecha_reserva: "2026-05-22",
      hora_inicio: "14:00",
      hora_fin: "16:00",
      tipo_reserva: "entrenamiento",
      nombre_solicitante: "Juan Pérez",
      ci: 12345678,
      complemento: undefined,
      motivo: "Entrenamiento",
      correo_solicitante: undefined,
      id_persona_aprobador: 1,
    };

    it("debe crear una reserva exitosamente", async () => {
      (mockPrisma.espacios as any).findUnique.mockResolvedValue(espacioMock);
      (mockPrisma.plantilla_horarios_fijos as any).findFirst.mockResolvedValue(null);
      (mockTx.reservas as any).findFirst.mockResolvedValue(null);
      (mockTx.reservas as any).create.mockResolvedValue(reservaMock);

      const result = await service.create(dtoValido);

      expect(result).toBeDefined();
      expect(result.nombre_solicitante).toBe("Juan Pérez");
    });

    it("debe lanzar BadRequestException si hora_fin <= hora_inicio", async () => {
      await expect(
        service.create({ ...dtoValido, hora_inicio: "16:00", hora_fin: "14:00" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("debe lanzar BadRequestException si duracion > 3 horas", async () => {
      await expect(
        service.create({ ...dtoValido, hora_inicio: "14:00", hora_fin: "18:00" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("debe lanzar NotFoundException si el espacio no existe", async () => {
      (mockPrisma.espacios as any).findUnique.mockResolvedValue(null);

      await expect(service.create(dtoValido)).rejects.toThrow(NotFoundException);
    });

    it("debe lanzar ConflictException si el horario esta fuera del rango del espacio", async () => {
      (mockPrisma.espacios as any).findUnique.mockResolvedValue(espacioMock);

      await expect(
        service.create({ ...dtoValido, hora_inicio: "05:00", hora_fin: "06:00" }),
      ).rejects.toThrow(ConflictException);
    });

    it("debe lanzar ConflictException si coincide con horario de clase", async () => {
      (mockPrisma.espacios as any).findUnique.mockResolvedValue(espacioMock);
      (mockPrisma.plantilla_horarios_fijos as any).findFirst.mockResolvedValue({ id: 99 });

      await expect(service.create(dtoValido)).rejects.toThrow(ConflictException);
    });

    it("debe lanzar ConflictException si ya existe otra reserva en el mismo horario", async () => {
      (mockPrisma.espacios as any).findUnique.mockResolvedValue(espacioMock);
      (mockPrisma.plantilla_horarios_fijos as any).findFirst.mockResolvedValue(null);
      (mockTx.reservas as any).findFirst.mockResolvedValue({ id_reserva: 999 });

      await expect(service.create(dtoValido)).rejects.toThrow(ConflictException);
    });
  });

  // ========================
  // update
  // ========================
  describe("update", () => {
    it("debe lanzar BadRequestException si duracion > 3h", async () => {
      (mockPrisma.reservas as any).findUnique.mockResolvedValue(reservaMock);

      await expect(
        service.update(1, { hora_inicio: "14:00", hora_fin: "18:00" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("debe lanzar ConflictException si ya esta cancelada", async () => {
      const canceladaMock = { ...reservaMock, estado: "cancelada" };
      (mockPrisma.reservas as any).findUnique.mockResolvedValue(canceladaMock);
      (mockTx.reservas as any).findUnique.mockResolvedValue(canceladaMock);

      await expect(service.update(1, { estado: "cancelada" })).rejects.toThrow(ConflictException);
    });

    it("debe cancelar reserva exitosamente", async () => {
      (mockPrisma.reservas as any).findUnique.mockResolvedValue(reservaMock);
      (mockTx.reservas as any).findUnique.mockResolvedValue(reservaMock);
      const updatedMock = { ...reservaMock, estado: "cancelada" };
      (mockTx.reservas as any).update.mockResolvedValue(updatedMock);

      const result = await service.update(1, { estado: "cancelada" });

      expect(result.estado).toBe("cancelada");
    });
  });
});
