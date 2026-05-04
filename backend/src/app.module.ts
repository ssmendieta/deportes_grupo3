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
import { ReservasModule } from "./reservas/reserva.module";
import { PagosModule } from "./pagos/pagos.module";
import { AuthMiddleware } from "./middleware/auth.middleware";

@Module({
  imports: [
    PrismaModule,
    EspaciosModule,
    HorariosModule,
    DisciplinasModule,
    ReservasModule,
    PagosModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(
      { path: "api/reservas", method: RequestMethod.ALL },
      { path: "api/reservas/*path", method: RequestMethod.ALL },
      { path: "api/pagos", method: RequestMethod.ALL }, // ← nuevo
      { path: "api/pagos/*path", method: RequestMethod.ALL },
    );
  }
}
