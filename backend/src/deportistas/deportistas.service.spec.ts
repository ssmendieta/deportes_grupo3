import { Test, TestingModule } from "@nestjs/testing";
import { DeportistasService } from "./deportistas.service";
import { PrismaService } from "../prisma/prisma.service";

describe("DeportistasService", () => {
  let service: DeportistasService;

  const mockPrisma = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeportistasService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DeportistasService>(DeportistasService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
