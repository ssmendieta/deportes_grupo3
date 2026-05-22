import { Test, TestingModule } from "@nestjs/testing";
import { DeportistasController } from "./deportistas.controller";
import { DeportistasService } from "./deportistas.service";
import { ReportesService } from "../reportes/reportes.service";
import { PrismaService } from "../prisma/prisma.service";
import { mockPrisma, resetPrismaMocks } from "../prisma/__mocks__/prisma.service";

describe("DeportistasController", () => {
  let controller: DeportistasController;
  let deportistasService: DeportistasService;

  beforeEach(async () => {
    resetPrismaMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeportistasController],
      providers: [
        DeportistasService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: ReportesService,
          useValue: {
            generarExcel: jest.fn().mockResolvedValue(Buffer.from("excel")),
            generarPdfTabla: jest.fn().mockResolvedValue(Buffer.from("pdf")),
          },
        },
      ],
    }).compile();

    controller = module.get<DeportistasController>(DeportistasController);
    deportistasService = module.get<DeportistasService>(DeportistasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("debe llamar al servicio con filtros", async () => {
      const spy = jest.spyOn(deportistasService, "findAll").mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      await controller.findAll("1", "20", "academia", "3", "true");

      expect(spy).toHaveBeenCalledWith(1, 20, "academia", "3", "true");
    });
  });

  describe("buscarPorCi", () => {
    it("debe llamar al servicio para buscar por CI", async () => {
      const spy = jest.spyOn(deportistasService, "buscarPorCi").mockResolvedValue({} as any);

      await controller.buscarPorCi("12345678");

      expect(spy).toHaveBeenCalledWith("12345678");
    });
  });

  describe("findOne", () => {
    it("debe llamar al servicio para obtener por ID", async () => {
      const spy = jest.spyOn(deportistasService, "findOne").mockResolvedValue({} as any);

      await controller.findOne(1);

      expect(spy).toHaveBeenCalledWith(1);
    });
  });
});
