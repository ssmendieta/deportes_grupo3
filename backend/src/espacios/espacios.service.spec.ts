import { Test, TestingModule } from "@nestjs/testing";
import { EspaciosService } from "./espacios.service";
import { PrismaService } from "../prisma/prisma.service";
import { mockPrisma, resetPrismaMocks } from "../prisma/__mocks__/prisma.service";

describe("EspaciosService", () => {
  let service: EspaciosService;

  const espacioDbMock = {
    id_espacio: 1,
    nombre_espacio: "Coliseo UCB",
    hora_apertura: new Date("1970-01-01T07:00:00.000Z"),
    horario_cierre: new Date("1970-01-01T22:00:00.000Z"),
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
      (mockPrisma.espacios as any).findMany.mockResolvedValue([espacioDbMock]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].nombre).toBe("Coliseo UCB");
      expect((mockPrisma.espacios as any).findMany).toHaveBeenCalledWith({
        where: { activo: true },
      });
    });
  });

  describe("findOne", () => {
    it("debe retornar un espacio por ID", async () => {
      (mockPrisma.espacios as any).findUnique.mockResolvedValue(espacioDbMock);

      const result = await service.findOne(1);

      expect(result!.id).toBe(1);
      expect(result!.nombre).toBe("Coliseo UCB");
      expect((mockPrisma.espacios as any).findUnique).toHaveBeenCalledWith({
        where: { id_espacio: 1 },
      });
    });

    it("debe retornar null si el espacio no existe", async () => {
      (mockPrisma.espacios as any).findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });
});
