import { Test, TestingModule } from "@nestjs/testing";
import { EspaciosService } from "./espacios.service";
import { PrismaService } from "../prisma/prisma.service";
import { mockPrisma, resetPrismaMocks } from "../prisma/__mocks__/prisma.service";

describe("EspaciosService", () => {
  let service: EspaciosService;

  const espacioMock = {
    id: 1,
    nombre: "Coliseo UCB",
    horario_apertura: "07:00",
    horario_cierre: "22:00",
    activo: true,
  };

  beforeEach(async () => {
    resetPrismaMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EspaciosService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EspaciosService>(EspaciosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("debe retornar solo espacios activos", async () => {
      mockPrisma.espacio.findMany.mockResolvedValue([espacioMock]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(mockPrisma.espacio.findMany).toHaveBeenCalledWith({
        where: { activo: true },
      });
    });
  });

  describe("findOne", () => {
    it("debe retornar un espacio activo por ID", async () => {
      mockPrisma.espacio.findUnique.mockResolvedValue(espacioMock);

      const result = await service.findOne(1);

      expect(result!.id).toBe(1);
      expect(mockPrisma.espacio.findUnique).toHaveBeenCalledWith({
        where: { id: 1, activo: true },
      });
    });

    it("debe retornar null si el espacio no existe o esta inactivo", async () => {
      mockPrisma.espacio.findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });
});
