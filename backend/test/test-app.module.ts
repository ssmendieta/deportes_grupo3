import { Module, NestModule, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { PrismaModule } from "../src/prisma/prisma.module";
import { MailModule } from "../src/mail/mail.module";
import { EspaciosModule } from "../src/espacios/espacios.module";
import { HorariosModule } from "../src/horarios/horarios.module";
import { DisciplinasModule } from "../src/disciplinas/disciplinas.module";
import { ReservasModule } from "../src/reservas/reserva.module";
import { PagosModule } from "../src/pagos/pagos.module";
import { DeportistasModule } from "../src/deportistas/deportistas.module";
import { AuthModule } from "../src/auth/auth.module";
import { ReportesModule } from "../src/reportes/reportes.module";
import { TestAuthMiddleware } from "./test-auth.middleware";

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
    AuthModule,
    ReportesModule,
  ],
})
export class TestAppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TestAuthMiddleware).forRoutes(
      { path: "api/reservas", method: RequestMethod.ALL },
      { path: "api/reservas/*path", method: RequestMethod.ALL },
      { path: "api/pagos", method: RequestMethod.ALL },
      { path: "api/pagos/*path", method: RequestMethod.ALL },
      { path: "api/deportistas", method: RequestMethod.ALL },
      { path: "api/deportistas/*path", method: RequestMethod.ALL },
      { path: "api/disciplinas/reporte", method: RequestMethod.GET },
      { path: "api/reservas/reporte", method: RequestMethod.GET },
      { path: "api/pagos/reporte", method: RequestMethod.GET },
      { path: "api/disciplinas", method: RequestMethod.POST },
      { path: "api/disciplinas/*path", method: RequestMethod.PATCH },
    );
  }
}
