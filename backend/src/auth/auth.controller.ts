import { Controller, Post, Req, HttpCode, Logger } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("auth")
@Controller("api/auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  @Post("logout")
  @HttpCode(204)
  @ApiOperation({ summary: "Cerrar sesión", description: "Invalida la sesión del usuario del lado del servidor." })
  logout(@Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub ?? "desconocido";
    this.logger.log(`Sesión cerrada para usuario: ${userId}`);
  }
}
