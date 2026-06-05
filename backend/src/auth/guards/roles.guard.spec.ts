import { ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "./roles.guard";

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector;
    guard = new RolesGuard(reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockContext = (user?: any) => ({
    getHandler: jest.fn().mockReturnValue({}),
    getClass: jest.fn().mockReturnValue({}),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ user }),
    }),
  });

  it("debe permitir acceso si no hay roles requeridos", () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    const context = createMockContext();

    const result = guard.canActivate(context as any);

    expect(result).toBe(true);
  });

  it("debe permitir acceso si el rol coincide", () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(["admin", "entrenador"]);
    const context = createMockContext({ rol: "admin" });

    const result = guard.canActivate(context as any);

    expect(result).toBe(true);
  });

  it("debe permitir acceso con comparacion case-insensitive", () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(["Admin"]);
    const context = createMockContext({ rol: "admin" });

    const result = guard.canActivate(context as any);

    expect(result).toBe(true);
  });

  it("debe lanzar ForbiddenException si no hay usuario", () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(["admin"]);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context as any)).toThrow(ForbiddenException);
  });

  it("debe lanzar ForbiddenException si el usuario no tiene rol", () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(["admin"]);
    const context = createMockContext({ id: 1 });

    expect(() => guard.canActivate(context as any)).toThrow(ForbiddenException);
  });

  it("debe lanzar ForbiddenException si el rol no coincide", () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(["admin"]);
    const context = createMockContext({ rol: "deportista" });

    expect(() => guard.canActivate(context as any)).toThrow(ForbiddenException);
  });

  it("debe permitir acceso si el rol esta en la lista de roles permitidos", () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(["admin", "entrenador", "delegado"]);
    const context = createMockContext({ rol: "delegado" });

    const result = guard.canActivate(context as any);

    expect(result).toBe(true);
  });
});
