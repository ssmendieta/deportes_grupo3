import { ExecutionContext, CallHandler } from "@nestjs/common";
import { lastValueFrom, of, throwError } from "rxjs";
import { AuditoriaInterceptor } from "./auditoria.interceptor";
import { AuditoriaService } from "./auditoria.service";

interface MockRequest {
  method: string;
  originalUrl: string;
  ip?: string;
  socket?: { remoteAddress?: string };
  user?: { id: number; email?: string };
}

describe("AuditoriaInterceptor", () => {
  let interceptor: AuditoriaInterceptor;
  let mockAuditoriaService: jest.Mocked<AuditoriaService>;

  function mockContext(req: MockRequest): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          method: req.method,
          originalUrl: req.originalUrl,
          ip: req.ip ?? "127.0.0.1",
          socket: { remoteAddress: req.socket?.remoteAddress ?? "127.0.0.1" },
          user: req.user,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  function mockCallHandler(body: unknown): CallHandler {
    return { handle: () => of(body) };
  }

  function mockErrorHandler(error: Error): CallHandler {
    return { handle: () => throwError(() => error) };
  }

  beforeEach(() => {
    mockAuditoriaService = {
      registrar: jest.fn().mockResolvedValue(undefined),
      obtenerDatosAnteriores: jest.fn().mockResolvedValue(null),
    } as any;

    interceptor = new AuditoriaInterceptor(mockAuditoriaService);
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
      const body = { id: 42 };

      await lastValueFrom(
        await interceptor.intercept(
          mockContext({ method, originalUrl: url, user: { id: 1, email: "admin@test.com" } }),
          mockCallHandler(body),
        ),
      );

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

  it("debe auditar aunque la URL tenga query string", async () => {
    await lastValueFrom(
      await interceptor.intercept(
        mockContext({ method: "POST", originalUrl: "/api/reservas?debug=1", user: { id: 1 } }),
        mockCallHandler({ id: 7 }),
      ),
    );

    expect(mockAuditoriaService.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ tabla: "reserva", registro_id: 7 }),
    );
  });

  it("no debe auditar GET requests", async () => {
    await lastValueFrom(
      await interceptor.intercept(
        mockContext({ method: "GET", originalUrl: "/api/reservas" }),
        mockCallHandler({ id: 42 }),
      ),
    );

    expect(mockAuditoriaService.registrar).not.toHaveBeenCalled();
  });

  it("no debe auditar rutas no registradas", async () => {
    await lastValueFrom(
      await interceptor.intercept(
        mockContext({ method: "POST", originalUrl: "/api/unknown" }),
        mockCallHandler({ id: 42 }),
      ),
    );

    expect(mockAuditoriaService.registrar).not.toHaveBeenCalled();
  });

  it("no debe confundir rutas con prefijo similar", async () => {
    await lastValueFrom(
      await interceptor.intercept(
        mockContext({ method: "POST", originalUrl: "/api/reservas-legacy" }),
        mockCallHandler({ id: 42 }),
      ),
    );

    expect(mockAuditoriaService.registrar).not.toHaveBeenCalled();
  });

  it("debe extraer entidadId correctamente de rutas anidadas", async () => {
    await lastValueFrom(
      await interceptor.intercept(
        mockContext({ method: "PATCH", originalUrl: "/api/deportistas/5/inscripciones", user: { id: 1 } }),
        mockCallHandler({ success: true }),
      ),
    );

    expect(mockAuditoriaService.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ tabla: "inscripcion", registro_id: 5 }),
    );
  });

  it("debe capturar datos anteriores para PATCH", async () => {
    mockAuditoriaService.obtenerDatosAnteriores.mockResolvedValue({ estado: "Pendiente" });

    await lastValueFrom(
      await interceptor.intercept(
        mockContext({ method: "PATCH", originalUrl: "/api/reservas/10", user: { id: 1 } }),
        mockCallHandler({ id: 10, estado: "confirmada" }),
      ),
    );

    expect(mockAuditoriaService.obtenerDatosAnteriores).toHaveBeenCalledWith("reserva", 10);
    expect(mockAuditoriaService.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        datos_anteriores: { estado: "Pendiente" },
        datos_nuevos: { id: 10, estado: "confirmada" },
      }),
    );
  });

  it("debe usar entidadId como registro_id si el body no trae id", async () => {
    await lastValueFrom(
      await interceptor.intercept(
        mockContext({ method: "DELETE", originalUrl: "/api/reservas/8", user: { id: 1 } }),
        mockCallHandler({ success: true }),
      ),
    );

    expect(mockAuditoriaService.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ registro_id: 8 }),
    );
  });

  it("debe registrar operaciones mutantes que fallan", async () => {
    const error = new Error("Conflicto de horario");

    await expect(
      lastValueFrom(
        await interceptor.intercept(
          mockContext({ method: "POST", originalUrl: "/api/reservas", user: { id: 1 } }),
          mockErrorHandler(error),
        ),
      ),
    ).rejects.toThrow(error);

    expect(mockAuditoriaService.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        tabla: "reserva",
        accion: "ERROR_CREAR",
        datos_nuevos: { error: "Conflicto de horario" },
      }),
    );
  });
});
