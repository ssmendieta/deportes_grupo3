export interface ExternalTransaction {
  id_transaccion_caja: string;
  nit_ci_cliente: number;
  nombre_titular: string;
  monto_total: number;
  detalle: string | null;
  concepto: string;
  fecha_pago: string;
  estado_factura: string;
}

export interface SyncDataSource {
  fetchNewTransactions(): Promise<ExternalTransaction[]>;
}
