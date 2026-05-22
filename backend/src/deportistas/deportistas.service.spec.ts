import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { DeportistasService } from "./deportistas.service";
import { PrismaService } from "../prisma/prisma.service";
import { mockPrisma, mockTx, resetPrismaMocks } from "../prisma/__mocks__/prisma.service";

describe("DeportistasService", () => {
  let service: DeportistasService;

  const deportistaMock = {
    id: 1,
    tipo: "academia",
    ci: "12345678",
    nombre_completo: "Juan Pérez",
    carrera: "Ing. Sistemas",
    semestre: 5,
    activo: true,
    inscripciones: [],
  };

  beforeEach(async () => {
    resetPrismaMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeportistasService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DeportistasService>(DeportistasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ========================
  // findAll
  // ========================
  describe("findAll", () => {
    it("debe retornar lista paginada de deportistas", async () => {
      mockPrisma.deportista.findMany.mockResolvedValue([deportistaMock]);
      mockPrisma.deportista.count.mockResolvedValue(1);
      mockPrisma.planillaPagosAcademia.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("debe filtrar por tipo", async () => {
      mockPrisma.deportista.findMany.mockResolvedValue([]);
      mockPrisma.deportista.count.mockResolvedValue(0);
      mockPrisma.planillaPagosAcademia.findMany.mockResolvedValue([]);

      await service.findAll(1, 20, "academia");

      expect(mockPrisma.deportista.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tipo: "academia" }),
        }),
      );
    });

    it("debe filtrar por estado activo", async () => {
      mockPrisma.deportista.findMany.mockResolvedValue([]);
      mockPrisma.deportista.count.mockResolvedValue(0);
      mockPrisma.planillaPagosAcademia.findMany.mockResolvedValue([]);

      await service.findAll(1, 20, undefined, undefined, "true");

      expect(mockPrisma.deportista.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ activo: true }),
        }),
      );
    });
  });

  // ========================
  // findOne
  // ========================
  describe("findOne", () => {
    it("debe retornar un deportista por ID", async () => {
      mockPrisma.deportista.findUnique.mockResolvedValue(deportistaMock);
      mockPrisma.planillaPagosAcademia.findMany.mockResolvedValue([]);

      const result = await service.findOne(1);

      expect(result.id).toBe(1);
    });

    it("debe lanzar NotFoundException si no existe", async () => {
      mockPrisma.deportista.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ========================
  // buscarPorCi
  // ========================
  describe("buscarPorCi", () => {
    it("debe encontrar deportista por CI", async () => {
      mockPrisma.deportista.findUnique.mockResolvedValue(deportistaMock);
      mockPrisma.planillaPagosAcademia.findMany.mockResolvedValue([]);

      const result = await service.buscarPorCi("12345678");

      expect(result.ci).toBe("12345678");
    });

    it("debe lanzar NotFoundException si el CI no existe", async () => {
      mockPrisma.deportista.findUnique.mockResolvedValue(null);

      await expect(service.buscarPorCi("0000000")).rejects.toThrow(NotFoundException);
    });
  });

  // ========================
  // create
  // ========================
  describe("create", () => {
    const dtoValido = {
      tipo: "academia",
      ci: "87654321",
      nombre_completo: "María García",
      carrera: "Derecho",
      semestre: 3,
      fecha_nacimiento: "2000-05-15",
      genero: "femenino",
      telefono: "78945612",
      email: "maria@ucb.edu.bo",
    };

    it("debe crear un deportista exitosamente", async () => {
      mockPrisma.deportista.findUnique.mockResolvedValue(null);
      mockTx.deportista.create.mockResolvedValue({ id: 2, ...dtoValido });

      const result = await service.create(dtoValido);

      expect(result.id).toBe(2);
      expect(result.nombre_completo).toBe("María García");
    });

    it("debe lanzar ConflictException si el CI ya existe", async () => {
      mockPrisma.deportista.findUnique.mockResolvedValue(deportistaMock);

      await expect(service.create(dtoValido)).rejects.toThrow(ConflictException);
    });
  });

  // ========================
  // cambiarEstado
  // ========================
  describe("cambiarEstado", () => {
    it("debe desactivar un deportista", async () => {
      mockPrisma.deportista.findUnique.mockResolvedValue(deportistaMock);
      mockPrisma.planillaPagosAcademia.findMany.mockResolvedValue([]);
      mockPrisma.deportista.update.mockResolvedValue({ ...deportistaMock, activo: false });

      const result = await service.cambiarEstado(1, false);

      expect(result.activo).toBe(false);
    });

    it("debe lanzar NotFoundException si el deportista no existe", async () => {
      mockPrisma.deportista.findUnique.mockResolvedValue(null);

      await expect(service.cambiarEstado(999, false)).rejects.toThrow(NotFoundException);
    });
  });

  // ========================
  // inscribir
  // ========================
  describe("inscribir", () => {
    it("debe inscribir a un deportista en una disciplina", async () => {
      mockPrisma.deportista.findUnique.mockResolvedValue(deportistaMock);
      mockPrisma.planillaPagosAcademia.findMany.mockResolvedValue([]);
      mockPrisma.disciplina.findUnique.mockResolvedValue({ id: 1, nombre: "Fútsal" });
      mockPrisma.inscripcion.findFirst.mockResolvedValue(null);
      mockPrisma.inscripcion.create.mockResolvedValue({
        id: 1,
        deportista_id: 1,
        disciplina_id: 1,
        estado: "activo",
      });

      const result = await service.inscribir(1, { disciplinaId: 1 });

      expect(result.estado).toBe("activo");
    });

    it("debe lanzar ConflictException si ya esta inscrito", async () => {
      mockPrisma.deportista.findUnique.mockResolvedValue(deportistaMock);
      mockPrisma.planillaPagosAcademia.findMany.mockResolvedValue([]);
      mockPrisma.disciplina.findUnique.mockResolvedValue({ id: 1, nombre: "Fútsal" });
      mockPrisma.inscripcion.findFirst.mockResolvedValue({ id: 5 });

      await expect(service.inscribir(1, { disciplinaId: 1 })).rejects.toThrow(ConflictException);
    });
  });
});
