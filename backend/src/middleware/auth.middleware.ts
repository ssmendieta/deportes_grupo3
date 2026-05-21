import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);
  private readonly publicKey: string;

  constructor() {
    const keyPath = path.join(process.cwd(), "src", "config", "public.pem");
    try {
      this.publicKey = fs.readFileSync(keyPath, "utf8");
    } catch {
      this.logger.warn("public.pem no encontrado. Usando modo mock en desarrollo.");
      this.publicKey = "";
    }
  }

  use(req: any, res: any, next: () => void) {
    if (!this.publicKey) {
      const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
      if (isDev) {
        req.user = { rol: "admin", id: 0, email: "dev@localhost" };
        return next();
      }
      throw new Error("public.pem no configurado");
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      this.logger.warn(`Intento sin token: ${req.method} ${req.url}`);
      throw new UnauthorizedException(
        "No autorizado - se requiere token Bearer",
      );
    }

    const token = authHeader.split(" ")[1];

    try {
      const payload = jwt.verify(token, this.publicKey, {
        algorithms: ["RS256"],
      }) as jwt.JwtPayload;

      const rol = (payload.rol ?? payload.role) as string | undefined;

      if (!rol) {
        this.logger.warn(`Token sin rol: ${req.method} ${req.url}`);
        throw new ForbiddenException("El token no contiene información de rol");
      }

      if (rol !== "admin") {
        this.logger.warn(
          `Acceso denegado a usuario con rol "${rol}": ${req.method} ${req.url}`,
        );
        throw new ForbiddenException(
          "No tienes permisos para realizar esta acción",
        );
      }

      req.user = { ...payload, rol };
      next();
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        this.logger.warn(
          `Acceso no autorizado: ${req.method} ${req.url} - ${error.message}`,
        );
        throw error;
      }
      this.logger.warn(`Token inválido: ${req.method} ${req.url}`);
      throw new UnauthorizedException("Token inválido o expirado");
    }
  }
}
