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
  let personaAprobadorId: number;

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

    const espacio = await (prisma.espacios as any).findFirst({ where: { activo: true } });
    espacioId = espacio?.id_espacio ?? 1;

    const disciplina = await (prisma.disciplinas as any).findFirst({
      where: { activo: true },
    });
    disciplinaId = disciplina?.id_disciplina ?? 1;

    const persona = await (prisma.personas as any).findFirst();
    personaAprobadorId = persona?.id_persona;
    if (!personaAprobadorId) throw new Error("No se encontró ninguna persona en la BD para usar como aprobador");
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
    const testCi = 99999999;
    const testMotivo = "Test integración";

    it("retorna 201 y crea una reserva exitosamente", async () => {
      const espacio = await (prisma.espacios as any).findFirst({
        where: { activo: true },
        select: { id_espacio: true, hora_apertura: true, horario_cierre: true },
      });
      if (!espacio) return;

      const hora_inicio = "14:00";
      const hora_fin = "15:00";

      const res = await request(app.getHttpServer())
        .post("/api/reservas")
        .send({
          espacio_id: espacio.id_espacio,
          fecha_reserva: "2026-12-01",
          hora_inicio,
          hora_fin,
          tipo_reserva: "entrenamiento",
          nombre_solicitante: "Test Integración",
          ci: testCi,
          motivo: testMotivo,
          id_persona_aprobador: personaAprobadorId,
        });

      expect([201, 409]).toContain(res.status);

      if (res.status === 201) {
        expect(res.body).toHaveProperty("id");
        await (prisma.reservas as any)
          .delete({ where: { id_reserva: res.body.id } })
          .catch(() => {});
      }
    });

    it("retorna 400 si hora_fin <= hora_inicio", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/reservas")
        .send({
          espacio_id: espacioId,
          fecha_reserva: "2026-12-01",
          hora_inicio: "14:00",
          hora_fin: "13:00",
          tipo_reserva: "entrenamiento",
          nombre_solicitante: "Test",
          ci: testCi,
          motivo: testMotivo,
          id_persona_aprobador: personaAprobadorId,
        });
      expect(res.status).toBe(400);
    });

    it("retorna 400 si duración > 3 horas", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/reservas")
        .send({
          espacio_id: espacioId,
          fecha_reserva: "2026-12-01",
          hora_inicio: "08:00",
          hora_fin: "12:00",
          tipo_reserva: "entrenamiento",
          nombre_solicitante: "Test",
          ci: testCi,
          motivo: testMotivo,
          id_persona_aprobador: personaAprobadorId,
        });
      expect(res.status).toBe(400);
    });

    it("retorna 404 si espacio no existe", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/reservas")
        .send({
          espacio_id: 99999,
          fecha_reserva: "2026-12-01",
          hora_inicio: "10:00",
          hora_fin: "11:00",
          tipo_reserva: "entrenamiento",
          nombre_solicitante: "Test",
          ci: testCi,
          motivo: testMotivo,
          id_persona_aprobador: personaAprobadorId,
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
    const testCi = 98765432;
    let createdId: number | null = null;

    afterAll(async () => {
      if (createdId) {
        await (prisma.deportistas as any)
          .delete({ where: { id_deportista: createdId } })
          .catch(() => {});
      }
    });

    it("retorna 201 y crea un deportista", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/deportistas")
        .send({
          tipo_deportista: "academia",
          ci: testCi,
          nombres: "Test",
          ape_paterno: "Integración",
          ape_materno: "E2E",
          celular: "71234567",
          fecha_nacimiento: "2000-01-01",
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
          tipo_deportista: "academia",
          ci: testCi,
          nombres: "Duplicado",
          ape_paterno: "Prueba",
          ape_materno: "Dos",
          celular: "71234567",
          fecha_nacimiento: "2000-01-01",
        });
      expect(res.status).toBe(409);
    });
  });

  describe("GET /api/deportistas/buscar", () => {
    it("retorna 404 si el CI no existe", async () => {
      const res = await request(app.getHttpServer()).get(
        "/api/deportistas/buscar?ci=99999999",
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
        id_deportista_beneficiario: 99999,
        id_concepto: 1,
        monto_pagado: 120,
        fecha_pago: "2026-06-01",
        mes_correspondiente: 6,
        gestion: 2026,
        id_persona_pago: 1,
        id_transaccion_caja: "CAJA-TEST-001",
      });
      expect(res.status).toBe(404);
    });
  });
});
