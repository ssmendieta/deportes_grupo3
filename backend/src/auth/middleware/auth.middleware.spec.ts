import { UnauthorizedException } from "@nestjs/common";
import { AuthMiddleware } from "./auth.middleware";
import * as fs from "fs";
import * as jwt from "jsonwebtoken";

jest.mock("fs");
jest.mock("jsonwebtoken");

describe("AuthMiddleware", () => {
  let middleware: AuthMiddleware;
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    (fs.readFileSync as jest.Mock).mockReturnValue("fake-public-key");
    (jwt.verify as jest.Mock).mockReset();

    middleware = new AuthMiddleware();
    mockReq = { headers: {}, method: "GET", url: "/api/reservas" };
    mockRes = {};
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("debe llamar next() si el token es valido y extraer el rol", () => {
    mockReq.headers.authorization = "Bearer valid-token";
    (jwt.verify as jest.Mock).mockReturnValue({ rol: "admin", id: 1, email: "admin@test.com" });

    middleware.use(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user.rol).toBe("admin");
  });

  it("debe llamar next() si no hay header Authorization (ruta publica)", () => {
    middleware.use(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toBeUndefined();
  });

  it("debe llamar next() si el header no es Bearer (ruta publica)", () => {
    mockReq.headers.authorization = "Basic token123";

    middleware.use(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toBeUndefined();
  });

  it("debe lanzar UnauthorizedException si el token no tiene rol", () => {
    mockReq.headers.authorization = "Bearer token-sin-rol";
    (jwt.verify as jest.Mock).mockReturnValue({ id: 1, email: "user@test.com" });

    expect(() => middleware.use(mockReq, mockRes, mockNext)).toThrow(UnauthorizedException);
  });

  it("debe permitir cualquier rol valido (la autorizacion la maneja RolesGuard)", () => {
    mockReq.headers.authorization = "Bearer token-entrenador";
    (jwt.verify as jest.Mock).mockReturnValue({ rol: "entrenador", id: 2 });

    middleware.use(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user.rol).toBe("entrenador");
  });

  it("debe lanzar UnauthorizedException si el token es invalido", () => {
    mockReq.headers.authorization = "Bearer token-malito";
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("jwt malformed");
    });

    expect(() => middleware.use(mockReq, mockRes, mockNext)).toThrow(UnauthorizedException);
  });

  it("debe usar modo mock si ALLOW_DEV_MOCK=true y no hay public.pem", () => {
    (fs.readFileSync as jest.Mock).mockImplementation(() => { throw new Error("not found"); });
    process.env.ALLOW_DEV_MOCK = "true";

    const mockMiddleware = new AuthMiddleware();
    mockReq.headers.authorization = undefined;

    mockMiddleware.use(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user.rol).toBe("admin");

    process.env.ALLOW_DEV_MOCK = undefined;
  });

  it("debe extraer rol desde claim 'role' si 'rol' no existe", () => {
    mockReq.headers.authorization = "Bearer valid-token";
    (jwt.verify as jest.Mock).mockReturnValue({ role: "delegado", id: 3 });

    middleware.use(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user.rol).toBe("delegado");
  });
});
