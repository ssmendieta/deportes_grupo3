import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { ReservasService } from "./reservas.service";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { mockPrisma, mockTx, resetPrismaMocks } from "../prisma/__mocks__/prisma.service";

describe("ReservasService", () => {
  let service: ReservasService;

  const espacioMock = { id: 1, nombre: "Coliseo UCB", horario_apertura: "07:00", horario_cierre: "22:00", activo: true };
  const disciplinaMock = { id: 2, nombre: "Básquetbol", activo: true };
  const reservaMock = {
    id: 1,
    espacio_id: 1,
    disciplina_id: 2,
    fecha: new Date("2026-05-22T12:00:00.000Z"),
    hora_inicio: "14:00",
    hora_fin: "16:00",
    nombre_solicitante: "Juan Pérez",
    carnet: "1234567",
    motivo: "Entrenamiento",
    estado: "confirmada",
    email_solicitante: null,
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
      mockPrisma.reserva.findMany.mockResolvedValue([reservaMock]);
      mockPrisma.reserva.count.mockResolvedValue(1);

      const result = await service.findAll();

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect(mockPrisma.reserva.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 50 }),
      );
    });

    it("debe filtrar por espacioId", async () => {
      mockPrisma.reserva.findMany.mockResolvedValue([]);
      mockPrisma.reserva.count.mockResolvedValue(0);

      await service.findAll(1);

      expect(mockPrisma.reserva.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ espacio_id: 1 }),
        }),
      );
    });

    it("debe aplicar paginacion correctamente", async () => {
      mockPrisma.reserva.findMany.mockResolvedValue([]);
      mockPrisma.reserva.count.mockResolvedValue(0);

      await service.findAll(undefined, undefined, 2, 10);

      expect(mockPrisma.reserva.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });
  });

  // ========================
  // findOne
  // ========================
  describe("findOne", () => {
    it("debe retornar una reserva por ID", async () => {
      mockPrisma.reserva.findUnique.mockResolvedValue(reservaMock);

      const result = await service.findOne(1);

      expect(result.id).toBe(1);
      expect(mockPrisma.reserva.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { espacio: true, disciplina: true },
      });
    });

    it("debe lanzar NotFoundException si la reserva no existe", async () => {
      mockPrisma.reserva.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ========================
  // create
  // ========================
  describe("create", () => {
    const dtoValido = {
      espacio_id: 1,
      disciplina_id: 2,
      fecha: "2026-05-22",
      hora_inicio: "14:00",
      hora_fin: "16:00",
      nombre_solicitante: "Juan Pérez",
      carnet: "1234567",
      motivo: "Entrenamiento",
    };

    it("debe crear una reserva exitosamente", async () => {
      mockPrisma.espacio.findUnique.mockResolvedValue(espacioMock);
      mockPrisma.disciplina.findUnique.mockResolvedValue(disciplinaMock);
      mockPrisma.horarioDisponible.findFirst.mockResolvedValue(null);
      mockTx.reserva.findFirst.mockResolvedValue(null);
      mockTx.reserva.create.mockResolvedValue({ ...reservaMock, ...dtoValido });

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
      mockPrisma.espacio.findUnique.mockResolvedValue(null);
      mockPrisma.disciplina.findUnique.mockResolvedValue(disciplinaMock);

      await expect(service.create(dtoValido)).rejects.toThrow(NotFoundException);
    });

    it("debe lanzar NotFoundException si la disciplina no existe", async () => {
      mockPrisma.espacio.findUnique.mockResolvedValue(espacioMock);
      mockPrisma.disciplina.findUnique.mockResolvedValue(null);

      await expect(service.create(dtoValido)).rejects.toThrow(NotFoundException);
    });

    it("debe lanzar ConflictException si el horario esta fuera del rango del espacio", async () => {
      mockPrisma.espacio.findUnique.mockResolvedValue(espacioMock);
      mockPrisma.disciplina.findUnique.mockResolvedValue(disciplinaMock);

      await expect(
        service.create({ ...dtoValido, hora_inicio: "05:00", hora_fin: "06:00" }),
      ).rejects.toThrow(ConflictException);
    });

    it("debe lanzar ConflictException si coincide con horario de clase", async () => {
      mockPrisma.espacio.findUnique.mockResolvedValue(espacioMock);
      mockPrisma.disciplina.findUnique.mockResolvedValue(disciplinaMock);
      mockPrisma.horarioDisponible.findFirst.mockResolvedValue({ id: 99 });

      await expect(service.create(dtoValido)).rejects.toThrow(ConflictException);
    });

    it("debe lanzar ConflictException si ya existe otra reserva en el mismo horario", async () => {
      mockPrisma.espacio.findUnique.mockResolvedValue(espacioMock);
      mockPrisma.disciplina.findUnique.mockResolvedValue(disciplinaMock);
      mockPrisma.horarioDisponible.findFirst.mockResolvedValue(null);
      mockTx.reserva.findFirst.mockResolvedValue({ id: 999 });

      await expect(service.create(dtoValido)).rejects.toThrow(ConflictException);
    });
  });

  // ========================
  // update
  // ========================
  describe("update", () => {
    it("debe lanzar BadRequestException si duracion > 3h", async () => {
      mockPrisma.reserva.findUnique.mockResolvedValue(reservaMock);

      await expect(
        service.update(1, { hora_inicio: "14:00", hora_fin: "18:00" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("debe lanzar ConflictException si ya esta cancelada", async () => {
      mockPrisma.reserva.findUnique.mockResolvedValue({ ...reservaMock, estado: "cancelada" });
      mockTx.reserva.findUnique.mockResolvedValue({ ...reservaMock, estado: "cancelada" });

      await expect(service.update(1, { estado: "cancelada" })).rejects.toThrow(ConflictException);
    });

    it("debe cancelar reserva exitosamente", async () => {
      mockPrisma.reserva.findUnique.mockResolvedValue(reservaMock);
      mockTx.reserva.findUnique.mockResolvedValue(reservaMock);
      mockTx.reserva.update.mockResolvedValue({ ...reservaMock, estado: "cancelada" });

      const result = await service.update(1, { estado: "cancelada" });

      expect(result.estado).toBe("cancelada");
    });
  });
});
