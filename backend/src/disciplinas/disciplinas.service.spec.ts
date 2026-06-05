import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, ConflictException } from "@nestjs/common";
import { DisciplinasService } from "./disciplinas.service";
import { PrismaService } from "../prisma/prisma.service";
import { mockPrisma, resetPrismaMocks } from "../prisma/__mocks__/prisma.service";

describe("DisciplinasService", () => {
  let service: DisciplinasService;

  const disciplinaMock = {
    id_disciplina: 1,
    nombre_disciplina: "Fútsal",
    activo: true,
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
      (mockPrisma.disciplinas as any).findMany.mockResolvedValue([disciplinaMock]);

      const result = await service.findAll("true");

      expect(result).toHaveLength(1);
      expect((mockPrisma.disciplinas as any).findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { activo: true } }),
      );
    });

    it("debe retornar todas las disciplinas sin filtro", async () => {
      (mockPrisma.disciplinas as any).findMany.mockResolvedValue([disciplinaMock]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect((mockPrisma.disciplinas as any).findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });
  });

  describe("findOne", () => {
    it("debe retornar una disciplina por ID", async () => {
      (mockPrisma.disciplinas as any).findUnique.mockResolvedValue(disciplinaMock);

      const result = await service.findOne(1);

      expect(result!.nombre).toBe("Fútsal");
    });

    it("debe lanzar NotFoundException si no existe", async () => {
      (mockPrisma.disciplinas as any).findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("debe crear una disciplina exitosamente", async () => {
      (mockPrisma.disciplinas as any).findFirst.mockResolvedValue(null);
      (mockPrisma.disciplinas as any).create.mockResolvedValue({
        id_disciplina: 3,
        nombre_disciplina: "Tenis",
        activo: true,
      });

      const result = await service.create({ nombre_disciplina: "Tenis" });

      expect(result!.nombre).toBe("Tenis");
    });

    it("debe lanzar ConflictException si el nombre ya existe", async () => {
      (mockPrisma.disciplinas as any).findFirst.mockResolvedValue(disciplinaMock);

      await expect(
        service.create({ nombre_disciplina: "Fútsal" }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("update", () => {
    it("debe actualizar una disciplina", async () => {
      (mockPrisma.disciplinas as any).findUnique.mockResolvedValue(disciplinaMock);
      (mockPrisma.disciplinas as any).update.mockResolvedValue({
        ...disciplinaMock,
        nombre_disciplina: "Fútsal Actualizado",
      });

      const result = await service.update(1, {
        nombre_disciplina: "Fútsal Actualizado",
      });

      expect(result!.nombre).toBe("Fútsal Actualizado");
    });
  });

  describe("cambiarEstado", () => {
    it("debe desactivar una disciplina", async () => {
      (mockPrisma.disciplinas as any).findUnique.mockResolvedValue(disciplinaMock);
      (mockPrisma.disciplinas as any).update.mockResolvedValue({
        ...disciplinaMock,
        activo: false,
      });

      const result = await service.cambiarEstado(1, false);

      expect(result!.activo).toBe(false);
    });

    it("debe lanzar NotFoundException si no existe", async () => {
      (mockPrisma.disciplinas as any).findUnique.mockResolvedValue(null);

      await expect(service.cambiarEstado(999, false)).rejects.toThrow(NotFoundException);
    });
  });
});
