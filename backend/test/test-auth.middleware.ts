import { Injectable, NestMiddleware } from "@nestjs/common";

@Injectable()
export class TestAuthMiddleware implements NestMiddleware {
  use(req: any, _res: any, next: () => void) {
    req.user = { rol: "admin", id: 1, email: "test@test.com" };
    next();
  }
}
