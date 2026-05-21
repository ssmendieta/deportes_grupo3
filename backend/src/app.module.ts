import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { EspaciosModule } from "./espacios/espacios.module";
import { HorariosModule } from "./horarios/horarios.module";
import { DisciplinasModule } from "./disciplinas/disciplinas.module";
import { ReservasModule } from "./reservas/reserva.module";
import { PagosModule } from "./pagos/pagos.module";
import { AuthMiddleware } from "./middleware/auth.middleware";
import { AuthModule } from "./auth/auth.module";
import { DeportistasModule } from './deportistas/deportistas.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    MailModule,
    AuthModule,
    EspaciosModule,
    HorariosModule,
    DisciplinasModule,
    ReservasModule,
    PagosModule,
    DeportistasModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(
      { path: "api/reservas", method: RequestMethod.ALL },
      { path: "api/reservas/*path", method: RequestMethod.ALL },
      { path: "api/pagos", method: RequestMethod.ALL },
      { path: "api/pagos/*path", method: RequestMethod.ALL },
      { path: "api/deportistas", method: RequestMethod.ALL },
      { path: "api/deportistas/*path", method: RequestMethod.ALL },
      { path: "api/disciplinas", method: RequestMethod.POST },
      { path: "api/disciplinas/*path", method: RequestMethod.PATCH },
    );
  }
}
