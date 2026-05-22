import { Test, TestingModule } from "@nestjs/testing";
import { ReservasController } from "./reserva.controller";
import { ReservasService } from "./reservas.service";
import { ReportesService } from "../reportes/reportes.service";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { mockPrisma, resetPrismaMocks } from "../prisma/__mocks__/prisma.service";

describe("ReservasController", () => {
  let controller: ReservasController;
  let reservasService: ReservasService;

  beforeEach(async () => {
    resetPrismaMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservasController],
      providers: [
        ReservasService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: MailService,
          useValue: { sendReservaConfirmada: jest.fn() },
        },
        {
          provide: ReportesService,
          useValue: {
            generarExcel: jest.fn().mockResolvedValue(Buffer.from("excel")),
            generarPdfTabla: jest.fn().mockResolvedValue(Buffer.from("pdf")),
          },
        },
      ],
    }).compile();

    controller = module.get<ReservasController>(ReservasController);
    reservasService = module.get<ReservasService>(ReservasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("debe llamar al servicio con parametros de paginacion", async () => {
      const spy = jest.spyOn(reservasService, "findAll").mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 50,
      });

      await controller.findAll("1", "2026-05-22", "1", "50");

      expect(spy).toHaveBeenCalledWith(1, "2026-05-22", 1, 50);
    });

    it("debe usar valores por defecto si no se envian parametros", async () => {
      const spy = jest.spyOn(reservasService, "findAll").mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 50,
      });

      await controller.findAll();

      expect(spy).toHaveBeenCalledWith(undefined, undefined, 1, 50);
    });
  });
});
