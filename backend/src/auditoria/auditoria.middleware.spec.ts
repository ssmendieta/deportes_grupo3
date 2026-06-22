import { AuditoriaMiddleware } from "./auditoria.middleware";
import { AuditoriaService } from "./auditoria.service";

describe("AuditoriaMiddleware", () => {
  let middleware: AuditoriaMiddleware;
  let mockAuditoriaService: jest.Mocked<AuditoriaService>;

  const mockJson = jest.fn();

  function mockReq(opts: Partial<{
    method: string;
    url: string;
    user: Record<string, unknown>;
    ip: string;
  }> = {}) {
    return {
      method: opts.method ?? "GET",
      originalUrl: opts.url ?? "/api/test",
      ip: opts.ip ?? "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
      user: opts.user ?? null,
    } as any;
  }

  function mockRes() {
    return {
      json: mockJson,
      statusCode: 200,
    } as any;
  }

  beforeEach(() => {
    mockAuditoriaService = {
      registrar: jest.fn().mockResolvedValue(undefined),
      obtenerDatosAnteriores: jest.fn().mockResolvedValue(null),
    } as any;

    middleware = new AuditoriaMiddleware(mockAuditoriaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("detección de entidad y acción", () => {
    it.each([
      ["POST /api/reservas", "POST", "/api/reservas", "CREAR"],
      ["PATCH /api/reservas/5", "PATCH", "/api/reservas/5", "ACTUALIZAR"],
      ["DELETE /api/reservas/5", "DELETE", "/api/reservas/5", "ELIMINAR"],
      ["POST /api/deportistas", "POST", "/api/deportistas", "CREAR"],
      ["PATCH /api/deportistas/3/estado", "PATCH", "/api/deportistas/3/estado", "ACTUALIZAR_ESTADO"],
      ["POST /api/deportistas/3/inscripciones", "POST", "/api/deportistas/3/inscripciones", "INSCRIBIR"],
      ["POST /api/pagos", "POST", "/api/pagos", "CREAR"],
      ["PATCH /api/pagos/2/anular", "PATCH", "/api/pagos/2/anular", "ANULAR"],
      ["POST /api/disciplinas", "POST", "/api/disciplinas", "CREAR"],
      ["POST /api/espacios", "POST", "/api/espacios", "CREAR"],
      ["POST /api/horarios", "POST", "/api/horarios", "CREAR"],
    ])("%s debe auditarse", async (_label, method, url, accionEsperada) => {
      const req = mockReq({ method, url, user: { id: 1, email: "admin@test.com" } });
      const res = mockRes();
      const next = jest.fn();

      middleware.use(req, res, next);

      expect(next).toHaveBeenCalled();

      const llamadoBody = { id: 42 };
      res.json(llamadoBody);

      expect(mockAuditoriaService.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          tabla: expect.any(String),
          accion: accionEsperada,
          registro_id: 42,
          id_usuario: 1,
          ip_address: "127.0.0.1",
        }),
      );
    });
  });

  it("no debe auditar GET requests", () => {
    const req = mockReq({ method: "GET", url: "/api/reservas" });
    const res = mockRes();
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(mockAuditoriaService.registrar).not.toHaveBeenCalled();
  });

  it("no debe auditar rutas no registradas", () => {
    const req = mockReq({ method: "POST", url: "/api/unknown" });
    const res = mockRes();
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(mockAuditoriaService.registrar).not.toHaveBeenCalled();
  });

  it("debe extraer entidadId correctamente de rutas anidadas", () => {
    const req = mockReq({
      method: "PATCH",
      url: "/api/deportistas/5/inscripciones",
      user: { id: 1 },
    });
    const res = mockRes();
    const next = jest.fn();

    middleware.use(req, res, next);
    res.json({});

    expect(mockAuditoriaService.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ registro_id: 5 }),
    );
  });

  it("debe capturar datos anteriores para PATCH", async () => {
    mockAuditoriaService.obtenerDatosAnteriores.mockResolvedValue({ estado: "Pendiente" });

    const req = mockReq({
      method: "PATCH",
      url: "/api/reservas/10",
      user: { id: 1 },
    });
    const res = mockRes();
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(mockAuditoriaService.obtenerDatosAnteriores).toHaveBeenCalledWith("reserva", 10);

    res.json({ id: 10, estado: "confirmada" });

    expect(mockAuditoriaService.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        datos_anteriores: { estado: "Pendiente" },
        datos_nuevos: { id: 10, estado: "confirmada" },
      }),
    );
  });
});
