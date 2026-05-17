import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly publicKey: string;

  constructor() {
    const keyPath = path.join(process.cwd(), "src", "config", "public.pem");
    try {
      this.publicKey = fs.readFileSync(keyPath, "utf8");
    } catch {
      throw new Error(
        `No se encontró la clave pública en ${keyPath}. ` +
          "Coloca el archivo public.pem del Grupo 1 en backend/src/config/public.pem",
      );
    }
  }

  use(req: any, res: any, next: () => void) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
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
        throw new ForbiddenException("El token no contiene información de rol");
      }

      if (rol !== "admin") {
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
        throw error;
      }
      throw new UnauthorizedException("Token inválido o expirado");
    }
  }
}
