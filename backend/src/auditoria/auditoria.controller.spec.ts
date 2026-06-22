import { Test, TestingModule } from "@nestjs/testing";
import { AuditoriaController } from "./auditoria.controller";
import { AuditoriaService } from "./auditoria.service";
import { PrismaService } from "../prisma/prisma.service";
import { mockPrisma, resetPrismaMocks } from "../prisma/__mocks__/prisma.service";

describe("AuditoriaController", () => {
  let controller: AuditoriaController;
  let service: AuditoriaService;

  beforeEach(async () => {
    resetPrismaMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditoriaController],
      providers: [
        AuditoriaService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<AuditoriaController>(AuditoriaController);
    service = module.get<AuditoriaService>(AuditoriaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("debe delegar al servicio con los parámetros correctos", async () => {
      const spy = jest.spyOn(service, "findAll").mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      await controller.findAll("reserva", undefined, undefined, undefined, 1, 50);

      expect(spy).toHaveBeenCalledWith({
        entidad: "reserva",
        usuario: undefined,
        desde: undefined,
        hasta: undefined,
        page: 1,
        limit: 50,
      });
    });
  });
});
