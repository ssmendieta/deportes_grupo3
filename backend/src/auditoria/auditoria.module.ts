import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AuditoriaController } from './auditoria.controller';
import { AuditoriaService } from './auditoria.service';
import { AuditoriaMiddleware } from './auditoria.middleware';

@Module({
  controllers: [AuditoriaController],
  providers: [AuditoriaService],
  exports: [AuditoriaService],
})
export class AuditoriaModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuditoriaMiddleware)
      .forRoutes(
        { path: 'api/reservas', method: RequestMethod.POST },
        { path: 'api/reservas/:id', method: RequestMethod.PATCH },
        { path: 'api/reservas/:id', method: RequestMethod.DELETE },
        { path: 'api/deportistas', method: RequestMethod.POST },
        { path: 'api/deportistas/:id', method: RequestMethod.PATCH },
        { path: 'api/deportistas/:id/estado', method: RequestMethod.PATCH },
        { path: 'api/deportistas/:id/inscripciones', method: RequestMethod.POST },
        { path: 'api/pagos', method: RequestMethod.POST },
        { path: 'api/pagos/:id/anular', method: RequestMethod.PATCH },
        { path: 'api/pagos/:id', method: RequestMethod.DELETE },
        { path: 'api/disciplinas', method: RequestMethod.POST },
        { path: 'api/disciplinas/:id', method: RequestMethod.PATCH },
        { path: 'api/disciplinas/:id/estado', method: RequestMethod.PATCH },
        { path: 'api/disciplinas/:id', method: RequestMethod.DELETE },
        { path: 'api/espacios', method: RequestMethod.POST },
        { path: 'api/espacios/:id', method: RequestMethod.PATCH },
        { path: 'api/espacios/:id', method: RequestMethod.DELETE },
        { path: 'api/horarios', method: RequestMethod.POST },
        { path: 'api/horarios/:id', method: RequestMethod.PATCH },
        { path: 'api/horarios/:id', method: RequestMethod.DELETE },
      );
  }
}
