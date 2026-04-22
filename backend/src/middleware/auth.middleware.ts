import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    // TODO: Reemplazar con verificación JWT cuando G1 entregue el token
    // const token = req.headers.authorization?.split(' ')[1];
    // const payload = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = payload;

    const rol = req.headers["x-rol"];

    if (!rol) {
      throw new UnauthorizedException(
        "No autorizado - se requiere autenticación",
      );
    }

    if (rol !== "admin") {
      throw new ForbiddenException(
        "No tienes permisos para realizar esta acción",
      );
    }

    req.user = { rol };
    next();
  }
}
