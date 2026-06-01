/// <reference types="jest" />
import "dotenv/config";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { TestAppModule } from "./test-app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Integración: API endpoints", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let espacioId: number;
  let disciplinaId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    // Use existing data IDs if available
    const espacio = await prisma.espacio.findFirst({ where: { activo: true } });
    espacioId = espacio?.id ?? 1;

    const disciplina = await prisma.disciplina.findFirst({
      where: { activo: true },
    });
    disciplinaId = disciplina?.id ?? 1;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  // ========================
  // Espacios — Público
  // ========================
  describe("GET /api/espacios", () => {
    it("retorna 200 y lista de espacios activos", async () => {
      const res = await request(app.getHttpServer()).get("/api/espacios");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty("nombre");
        expect(res.body[0]).toHaveProperty("horario_apertura");
      }
    });

    it("retorna 200 y detalle por ID", async () => {
      const res = await request(app.getHttpServer()).get(
        `/api/espacios/${espacioId}`,
      );
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(espacioId);
    });

    it("retorna 404 si el espacio no existe", async () => {
      const res = await request(app.getHttpServer()).get("/api/espacios/99999");
      expect(res.status).toBe(404);
    });
  });

  // ========================
  // Disciplinas — Público
  // ========================
  describe("GET /api/disciplinas", () => {
    it("retorna 200 y lista todas", async () => {
      const res = await request(app.getHttpServer()).get("/api/disciplinas");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("retorna 200 filtrado por activas", async () => {
      const res = await request(app.getHttpServer()).get(
        "/api/disciplinas?activo=true",
      );
      expect(res.status).toBe(200);
      if (res.body.length > 0) {
        expect(res.body.every((d: any) => d.activo === true)).toBe(true);
      }
    });

    it("retorna 200 y detalle por ID", async () => {
      const res = await request(app.getHttpServer()).get(
        `/api/disciplinas/${disciplinaId}`,
      );
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(disciplinaId);
    });

    it("retorna 404 si la disciplina no existe", async () => {
      const res = await request(app.getHttpServer()).get(
        "/api/disciplinas/99999",
      );
      expect(res.status).toBe(404);
    });
  });

  // ========================
  // Horarios — Público
  // ========================
  describe("GET /api/horarios-disponibles/:id", () => {
    it("retorna 200 con bloques ocupados para una fecha", async () => {
      const res = await request(app.getHttpServer()).get(
        `/api/horarios-disponibles/${espacioId}?fecha=2026-06-01`,
      );
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("espacio");
      expect(res.body).toHaveProperty("bloques_ocupados");
    });

    it("retorna 400 si falta fecha", async () => {
      const res = await request(app.getHttpServer()).get(
        `/api/horarios-disponibles/${espacioId}`,
      );
      expect(res.status).toBe(400);
    });
  });

  // ========================
  // Reservas — Protegido
  // ========================
  describe("GET /api/reservas", () => {
    it("retorna 200 con paginación", async () => {
      const res = await request(app.getHttpServer()).get("/api/reservas");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("total");
      expect(res.body).toHaveProperty("page");
      expect(res.body).toHaveProperty("limit");
    });

    it("retorna 200 filtrando por espacioId", async () => {
      const res = await request(app.getHttpServer()).get(
        `/api/reservas?espacioId=${espacioId}`,
      );
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
    });

    it("retorna 200 con paginación manual", async () => {
      const res = await request(app.getHttpServer()).get(
        "/api/reservas?page=1&limit=5",
      );
      expect(res.status).toBe(200);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(5);
    });
  });

  describe("POST /api/reservas", () => {
    const testCi = "99999999";
    const testMotivo = "Test integración";

    it("retorna 201 y crea una reserva exitosamente", async () => {
      const espacio = await prisma.espacio.findFirst({
        where: { activo: true },
        select: { id: true, horario_apertura: true, horario_cierre: true },
      });
      if (!espacio) return; // skip if no spaces

      const hora_inicio = espacio.horario_apertura;
      const [h, m] = hora_inicio.split(":").map(Number);
      const hora_fin = `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

      const res = await request(app.getHttpServer())
        .post("/api/reservas")
        .send({
          espacio_id: espacio.id,
          disciplina_id: disciplinaId,
          fecha: "2026-12-01",
          hora_inicio,
          hora_fin,
          nombre_solicitante: "Test Integración",
          carnet: testCi,
          motivo: testMotivo,
        });

      expect([201, 409]).toContain(res.status);

      if (res.status === 201) {
        expect(res.body).toHaveProperty("id");
        await prisma.reserva
          .delete({ where: { id: res.body.id } })
          .catch(() => {});
      }
    });

    it("retorna 400 si hora_fin <= hora_inicio", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/reservas")
        .send({
          espacio_id: espacioId,
          disciplina_id: disciplinaId,
          fecha: "2026-12-01",
          hora_inicio: "14:00",
          hora_fin: "13:00",
          nombre_solicitante: "Test",
          carnet: testCi,
          motivo: testMotivo,
        });
      expect(res.status).toBe(400);
    });

    it("retorna 400 si duración > 3 horas", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/reservas")
        .send({
          espacio_id: espacioId,
          disciplina_id: disciplinaId,
          fecha: "2026-12-01",
          hora_inicio: "08:00",
          hora_fin: "12:00",
          nombre_solicitante: "Test",
          carnet: testCi,
          motivo: testMotivo,
        });
      expect(res.status).toBe(400);
    });

    it("retorna 404 si espacio no existe", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/reservas")
        .send({
          espacio_id: 99999,
          disciplina_id: disciplinaId,
          fecha: "2026-12-01",
          hora_inicio: "10:00",
          hora_fin: "11:00",
          nombre_solicitante: "Test",
          carnet: testCi,
          motivo: testMotivo,
        });
      expect(res.status).toBe(404);
    });

    it("retorna 404 si disciplina no existe", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/reservas")
        .send({
          espacio_id: espacioId,
          disciplina_id: 99999,
          fecha: "2026-12-01",
          hora_inicio: "10:00",
          hora_fin: "11:00",
          nombre_solicitante: "Test",
          carnet: testCi,
          motivo: testMotivo,
        });
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/reservas/:id", () => {
    it("retorna 404 si la reserva no existe", async () => {
      const res = await request(app.getHttpServer()).get("/api/reservas/99999");
      expect(res.status).toBe(404);
    });
  });

  // ========================
  // Deportistas — Protegido
  // ========================
  describe("GET /api/deportistas", () => {
    it("retorna 200 con paginación", async () => {
      const res = await request(app.getHttpServer()).get("/api/deportistas");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("total");
    });

    it("retorna 200 con filtros", async () => {
      const res = await request(app.getHttpServer()).get(
        "/api/deportistas?tipo=academia&page=1&limit=5",
      );
      expect(res.status).toBe(200);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(5);
    });
  });

  describe("POST /api/deportistas", () => {
    const testCi = "TESTINTEGRACION01";
    let createdId: number | null = null;

    afterAll(async () => {
      if (createdId) {
        await prisma.deportista
          .delete({ where: { id: createdId } })
          .catch(() => {});
      }
    });

    it("retorna 201 y crea un deportista", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/deportistas")
        .send({
          tipo: "academia",
          ci: testCi,
          nombre_completo: "Test Integración",
          carrera: "Ing. Sistemas",
          semestre: 5,
          fecha_nacimiento: "2000-01-01",
          genero: "masculino",
          telefono: "12345678",
          email: "test@integracion.com",
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      createdId = res.body.id;
    });

    it("retorna 409 si el CI ya existe", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/deportistas")
        .send({
          tipo: "academia",
          ci: testCi,
          nombre_completo: "Duplicado",
          carrera: "Derecho",
          semestre: 3,
        });
      expect(res.status).toBe(409);
    });
  });

  describe("GET /api/deportistas/buscar", () => {
    it("retorna 404 si el CI no existe", async () => {
      const res = await request(app.getHttpServer()).get(
        "/api/deportistas/buscar?ci=NOEXISTE99",
      );
      expect(res.status).toBe(404);
    });
  });

  // ========================
  // Pagos — Protegido
  // ========================
  describe("GET /api/pagos/conceptos", () => {
    it("retorna 200 y lista de conceptos", async () => {
      const res = await request(app.getHttpServer()).get(
        "/api/pagos/conceptos",
      );
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("POST /api/pagos", () => {
    it("retorna 404 si deportista no existe", async () => {
      const res = await request(app.getHttpServer()).post("/api/pagos").send({
        deportista_id: 99999,
        concepto_id: 1,
        monto: 120,
        fecha_pago: "2026-06-01",
        mes: 6,
        anio: 2026,
      });
      expect(res.status).toBe(404);
    });
  });
});
