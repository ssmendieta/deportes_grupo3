import {
  Module,
  NestModule,
  MiddlewareConsumer,
} from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { EspaciosModule } from "./espacios/espacios.module";
import { HorariosModule } from "./horarios/horarios.module";
import { DisciplinasModule } from "./disciplinas/disciplinas.module";
import { ReservasModule } from "./reservas/reserva.module";
import { PagosModule } from "./pagos/pagos.module";
import { AuthMiddleware } from "./auth/middleware/auth.middleware";
import { AuthModule } from "./auth/auth.module";
import { DeportistasModule } from './deportistas/deportistas.module';
import { MailModule } from './mail/mail.module';
import { ReportesModule } from './reportes/reportes.module';
import { CarrerasModule } from './carreras/carreras.module';
import { RolesGuard } from './auth/guards/roles.guard';
import { HealthModule } from './health/health.module';
import { AuditoriaModule } from './auditoria/auditoria.module';

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
    ReportesModule,
    CarrerasModule,
    HealthModule,
    AuditoriaModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes('*');
  }
}