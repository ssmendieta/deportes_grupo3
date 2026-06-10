import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);
  private readonly publicKey: string | null | undefined;

  constructor() {
    const keyPath = path.join(process.cwd(), "src", "config", "public.pem");
    try {
      this.publicKey = fs.readFileSync(keyPath, "utf8");
    } catch {
      const allowMock = process.env.ALLOW_DEV_MOCK === "true";
      if (allowMock) {
        this.logger.warn("public.pem no encontrado. Usando modo mock (ALLOW_DEV_MOCK=true).");
        this.publicKey = null;
      } else {
        this.logger.error("public.pem no encontrado y ALLOW_DEV_MOCK no está activado.");
        this.publicKey = undefined;
      }
    }
  }

  use(req: any, res: any, next: () => void) {
    if (this.publicKey === null) {
      req.user = { rol: "admin", id: 0, email: "dev@localhost" };
      return next();
    }

    if (this.publicKey === undefined) {
      throw new Error("public.pem no configurado. Establezca ALLOW_DEV_MOCK=true para modo desarrollo.");
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];

    try {
      const payload = jwt.verify(token, this.publicKey, {
        algorithms: ["RS256"],
      }) as jwt.JwtPayload;

      const rol = (payload.rol ?? payload.role) as string | undefined;

      if (!rol) {
        this.logger.warn(`Token sin rol: ${req.method} ${req.url}`);
        throw new UnauthorizedException("El token no contiene información de rol");
      }

      req.user = { ...payload, rol };
      next();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Token inválido o expirado");
    }
  }
}
