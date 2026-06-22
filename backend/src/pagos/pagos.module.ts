import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { PagosController } from "./pagos.controller";
import { PagosService } from "./pagos.service";
import { PagosSyncService } from "./pagos-sync.service";
import { MockSyncDataSource } from "./mock-sync-data-source";

/**
 * Módulo de pagos.
 *
 * Nota: MockSyncDataSource se usa como fuente de datos de caja externa.
 * Para integrar con caja real, reemplazar `MockSyncDataSource` por un
 * provider que implemente la interfaz SyncDataSource.
 */
@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [PagosController],
  providers: [PagosService, PagosSyncService, MockSyncDataSource],
  exports: [PagosSyncService],
})
export class PagosModule {}
