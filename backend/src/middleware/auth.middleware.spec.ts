import { UnauthorizedException, ForbiddenException } from "@nestjs/common";
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

  it("debe llamar next() si el token admin es valido", () => {
    mockReq.headers.authorization = "Bearer valid-token";
    (jwt.verify as jest.Mock).mockReturnValue({ rol: "admin", id: 1, email: "admin@test.com" });

    middleware.use(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user.rol).toBe("admin");
  });

  it("debe lanzar UnauthorizedException si no hay header Authorization", () => {
    expect(() => middleware.use(mockReq, mockRes, mockNext)).toThrow(UnauthorizedException);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("debe lanzar UnauthorizedException si el header no es Bearer", () => {
    mockReq.headers.authorization = "Basic token123";

    expect(() => middleware.use(mockReq, mockRes, mockNext)).toThrow(UnauthorizedException);
  });

  it("debe lanzar ForbiddenException si el token no tiene rol", () => {
    mockReq.headers.authorization = "Bearer token-sin-rol";
    (jwt.verify as jest.Mock).mockReturnValue({ id: 1, email: "user@test.com" });

    expect(() => middleware.use(mockReq, mockRes, mockNext)).toThrow(ForbiddenException);
  });

  it("debe lanzar ForbiddenException si el rol no es admin", () => {
    mockReq.headers.authorization = "Bearer token-estudiante";
    (jwt.verify as jest.Mock).mockReturnValue({ rol: "estudiante", id: 2 });

    expect(() => middleware.use(mockReq, mockRes, mockNext)).toThrow(ForbiddenException);
  });

  it("debe lanzar UnauthorizedException si el token es invalido", () => {
    mockReq.headers.authorization = "Bearer token-malito";
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("jwt malformed");
    });

    expect(() => middleware.use(mockReq, mockRes, mockNext)).toThrow(UnauthorizedException);
  });

  it("debe usar modo mock en desarrollo si no hay public.pem", () => {
    (fs.readFileSync as jest.Mock).mockImplementation(() => { throw new Error("not found"); });
    process.env.NODE_ENV = "development";

    const mockMiddleware = new AuthMiddleware();
    mockReq.headers.authorization = undefined;

    mockMiddleware.use(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user.rol).toBe("admin");

    process.env.NODE_ENV = undefined;
  });
});
