import { Injectable } from "@nestjs/common";
import type { ExternalTransaction, SyncDataSource } from "./interfaces/sync-data-source.interface";

/**
 * Fuente de datos mock para la sincronización con caja externa.
 *
 * Actualmente el sistema NO se conecta a una caja real: este adaptador genera
 * transacciones de prueba. Para integrar con una caja externa (API, archivo,
 * cola, etc.) implementar la interfaz SyncDataSource y reemplazar la
 * inyección de MockSyncDataSource en PagosModule.
 */
@Injectable()
export class MockSyncDataSource implements SyncDataSource {
  private contador = 0;

  async fetchNewTransactions(): Promise<ExternalTransaction[]> {
    this.contador++;

    return [
      {
        id_transaccion_caja: `CAJA-MOCK-${this.contador}-A`,
        nit_ci_cliente: 1234567,
        nombre_titular: "Juan Pérez",
        monto_total: 500,
        detalle: "Mensualidad marzo\nMensualidad abril",
        concepto: "Mensualidad",
        fecha_pago: new Date().toISOString().split("T")[0],
        estado_factura: "Activa",
      },
      {
        id_transaccion_caja: `CAJA-MOCK-${this.contador}-B`,
        nit_ci_cliente: 7654321,
        nombre_titular: "María López",
        monto_total: 250,
        detalle: "Mensualidad marzo",
        concepto: "Mensualidad",
        fecha_pago: new Date().toISOString().split("T")[0],
        estado_factura: "Activa",
      },
    ];
  }
}
