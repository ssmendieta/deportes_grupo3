import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { EspaciosModule } from "./espacios/espacios.module";
import { HorariosModule } from "./horarios/horarios.module";
import { DisciplinasModule } from "./disciplinas/disciplinas.module";
import { AuthMiddleware } from "./middleware/auth.middleware";

@Module({
  imports: [PrismaModule, EspaciosModule, HorariosModule, DisciplinasModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: "api/reservas", method: RequestMethod.ALL },
        { path: "api/reservas/*", method: RequestMethod.ALL },
      );
  }
}
