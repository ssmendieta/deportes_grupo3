import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, ConflictException } from "@nestjs/common";
import { DisciplinasService } from "./disciplinas.service";
import { PrismaService } from "../prisma/prisma.service";
import { mockPrisma, resetPrismaMocks } from "../prisma/__mocks__/prisma.service";

describe("DisciplinasService", () => {
  let service: DisciplinasService;

  const disciplinaMock = {
    id: 1,
    nombre: "Fútsal",
    descripcion: "Fútbol sala",
    categorias: "Mayores, Sub-17",
    mensualidad: 120,
    activo: true,
    orden: 1,
  };

  beforeEach(async () => {
    resetPrismaMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisciplinasService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DisciplinasService>(DisciplinasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("debe retornar todas las disciplinas activas", async () => {
      mockPrisma.disciplina.findMany.mockResolvedValue([disciplinaMock]);

      const result = await service.findAll("true");

      expect(result).toHaveLength(1);
      expect(mockPrisma.disciplina.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { activo: true } }),
      );
    });

    it("debe retornar todas las disciplinas sin filtro", async () => {
      mockPrisma.disciplina.findMany.mockResolvedValue([disciplinaMock]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(mockPrisma.disciplina.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });
  });

  describe("findOne", () => {
    it("debe retornar una disciplina por ID", async () => {
      mockPrisma.disciplina.findUnique.mockResolvedValue(disciplinaMock);

      const result = await service.findOne(1);

      expect(result.nombre).toBe("Fútsal");
    });

    it("debe lanzar NotFoundException si no existe", async () => {
      mockPrisma.disciplina.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("debe crear una disciplina exitosamente", async () => {
      mockPrisma.disciplina.findUnique.mockResolvedValue(null);
      mockPrisma.disciplina.create.mockResolvedValue({ id: 3, nombre: "Tenis", activo: true });

      const result = await service.create({ nombre: "Tenis" } as any);

      expect(result.nombre).toBe("Tenis");
    });

    it("debe lanzar ConflictException si el nombre ya existe", async () => {
      mockPrisma.disciplina.findUnique.mockResolvedValue(disciplinaMock);

      await expect(service.create({ nombre: "Fútsal" } as any)).rejects.toThrow(ConflictException);
    });
  });

  describe("update", () => {
    it("debe actualizar una disciplina", async () => {
      mockPrisma.disciplina.findUnique.mockResolvedValue(disciplinaMock);
      mockPrisma.disciplina.update.mockResolvedValue({ ...disciplinaMock, descripcion: "Actualizado" });

      const result = await service.update(1, { descripcion: "Actualizado" });

      expect(result.descripcion).toBe("Actualizado");
    });
  });

  describe("cambiarEstado", () => {
    it("debe desactivar una disciplina", async () => {
      mockPrisma.disciplina.findUnique.mockResolvedValue(disciplinaMock);
      mockPrisma.disciplina.update.mockResolvedValue({ ...disciplinaMock, activo: false });

      const result = await service.cambiarEstado(1, false);

      expect(result.activo).toBe(false);
    });

    it("debe lanzar NotFoundException si no existe", async () => {
      mockPrisma.disciplina.findUnique.mockResolvedValue(null);

      await expect(service.cambiarEstado(999, false)).rejects.toThrow(NotFoundException);
    });
  });
});
