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
import { DeportistasModule } from './deportistas/deportistas.module';
import { MailModule } from './mail/mail.module';
import { ReportesModule } from './reportes/reportes.module';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    EspaciosModule,
    HorariosModule,
    DisciplinasModule,
    ReservasModule,
    PagosModule,
    DeportistasModule,
    ReportesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(
      { path: "api/reservas", method: RequestMethod.ALL },
      { path: "api/reservas/*path", method: RequestMethod.ALL },
      { path: "api/pagos", method: RequestMethod.ALL },
      { path: "api/pagos/*path", method: RequestMethod.ALL },

      { path: "api/deportistas/reporte", method: RequestMethod.GET },
      { path: "api/disciplinas/reporte", method: RequestMethod.GET },
      { path: "api/reservas/reporte", method: RequestMethod.GET },
      { path: "api/pagos/reporte", method: RequestMethod.GET },
      
      { path: "api/deportistas", method: RequestMethod.ALL },
      { path: "api/disciplinas", method: RequestMethod.ALL },
    );
  }
}
