import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { MockSyncDataSource } from "./mock-sync-data-source";
import type { ExternalTransaction } from "./interfaces/sync-data-source.interface";

const ITEM_SEPARATORS = /[\n,;]+/;

/**
 * Servicio de sincronización de pagos con caja externa.
 *
 * Actualmente consume MockSyncDataSource. El cron está deshabilitado por
 * defecto y solo se activa con la variable de entorno PAGOS_SYNC_CRON_ENABLED=true.
 * Para producción, reemplazar MockSyncDataSource por un adaptador real en
 * PagosModule y habilitar el cron si aplica.
 */
@Injectable()
export class PagosSyncService {
  private readonly logger = new Logger(PagosSyncService.name);

  constructor(
    private prisma: PrismaService,
    private dataSource: MockSyncDataSource,
  ) {}

  async sync(): Promise<{ creados: number; parciales: number; errores: number }> {
    const transacciones = await this.dataSource.fetchNewTransactions();
    this.logger.log(`Recibidas ${transacciones.length} transacciones externas`);

    let creados = 0;
    let parciales = 0;
    let errores = 0;

    for (const tx of transacciones) {
      try {
        const resultado = await this.procesarTransaccion(tx);
        if (resultado === "completado") creados++;
        else if (resultado === "parcial") parciales++;
        else errores++;
      } catch (err) {
        this.logger.error(`Error procesando ${tx.id_transaccion_caja}: ${err}`);
        errores++;
      }
    }

    return { creados, parciales, errores };
  }

  private async procesarTransaccion(tx: ExternalTransaction): Promise<"completado" | "parcial" | "error"> {
    const existente = await this.prisma.transaccion_sync.findUnique({
      where: { id_transaccion_caja: tx.id_transaccion_caja },
    });
    if (existente) {
      this.logger.log(`Transacción ${tx.id_transaccion_caja} ya procesada, saltando`);
      return "completado";
    }

    return this.prisma.$transaction(async (prismaTx) => {
      const persona = await prismaTx.personas.findFirst({
        where: { ci: tx.nit_ci_cliente },
      });
      if (!persona) {
        await this.insertarTransaccion(prismaTx, tx, null, "error");
        this.logger.warn(`Persona con CI ${tx.nit_ci_cliente} no encontrada`);
        return "error";
      }

      const hijos = await prismaTx.deportistas.findMany({
        where: { id_persona_tutor: persona.id_persona, activo: true },
      });

      if (hijos.length === 0) {
        await this.insertarTransaccion(prismaTx, tx, persona.id_persona, "error");
        this.logger.warn(`El tutor ${persona.id_persona} no tiene hijos activos`);
        return "error";
      }

      const cantidadItems = this.contarItems(tx.detalle);

      if (tx.estado_factura === "Anulado") {
        await this.insertarTransaccion(prismaTx, tx, persona.id_persona, "procesado");
        this.logger.log(`Transacción ${tx.id_transaccion_caja} anulada, saltando`);
        return "completado";
      }

      if (cantidadItems >= hijos.length) {
        await this.insertarTransaccion(prismaTx, tx, persona.id_persona, "procesado");
        await this.crearPagos(prismaTx, tx, persona.id_persona, hijos);
        this.logger.log(`Auto-asignados ${hijos.length} pagos para transacción ${tx.id_transaccion_caja}`);
        return "completado";
      }

      await this.insertarTransaccion(prismaTx, tx, persona.id_persona, "parcial");
      this.logger.log(`Transacción ${tx.id_transaccion_caja} marcada como parcial (${cantidadItems} items, ${hijos.length} hijos)`);
      return "parcial";
    });
  }

  private contarItems(detalle: string | null): number {
    if (!detalle || detalle.trim().length === 0) return 1;
    return detalle.split(ITEM_SEPARATORS).filter((l) => l.trim().length > 0).length;
  }

  private async insertarTransaccion(
    tx: any,
    externalTx: ExternalTransaction,
    idPersonaPagador: number | null,
    estadoSync: string,
  ) {
    await tx.transaccion_sync.create({
      data: {
        id_transaccion_caja: externalTx.id_transaccion_caja,
        nit_ci_cliente: externalTx.nit_ci_cliente,
        nombre_titular: externalTx.nombre_titular,
        monto_total: externalTx.monto_total,
        detalle: externalTx.detalle,
        concepto: externalTx.concepto,
        fecha_pago: new Date(externalTx.fecha_pago),
        estado_factura: externalTx.estado_factura,
        estado_sync: estadoSync,
        id_persona_pagador: idPersonaPagador,
      },
    });
  }

  private async crearPagos(
    tx: any,
    externalTx: ExternalTransaction,
    idPersonaPago: number,
    hijos: { id_deportista: number }[],
  ) {
    const syncRecord = await tx.transaccion_sync.findUnique({
      where: { id_transaccion_caja: externalTx.id_transaccion_caja },
    });
    if (!syncRecord) return;

    const montoPorHijo = Number(externalTx.monto_total) / hijos.length;
    const concepto = await tx.conceptos_pago.findFirst({
      where: { activo: true },
      orderBy: { id_concepto: "asc" },
    });

    if (!concepto) {
      this.logger.warn("No hay conceptos de pago activos, no se pueden crear pagos");
      return;
    }

    const mes = new Date().getMonth() + 1;
    const gestion = new Date().getFullYear();

    for (const hijo of hijos) {
      await tx.pagos.create({
        data: {
          id_persona_pago: idPersonaPago,
          id_deportista_beneficiario: hijo.id_deportista,
          id_concepto: concepto.id_concepto,
          id_transaccion_caja: externalTx.id_transaccion_caja,
          monto_pagado: montoPorHijo,
          fecha_pago: new Date(externalTx.fecha_pago),
          mes_correspondiente: mes,
          gestion,
          estado_factura: "Activa",
          id_transaccion_sync: syncRecord.id_sync_transaccion,
        },
      });
    }
  }

  async getPendientes() {
    return this.prisma.transaccion_sync.findMany({
      where: { estado_sync: "parcial" },
      orderBy: { fecha_recepcion: "desc" },
    });
  }

  async asignarPago(
    idSyncTransaccion: number,
    data: { id_deportista: number; id_concepto: number; mes_correspondiente: number; monto: number },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const syncTx = await tx.transaccion_sync.findUnique({
        where: { id_sync_transaccion: idSyncTransaccion },
      });
      if (!syncTx) throw new NotFoundException("Transacción no encontrada");
      if (syncTx.estado_sync !== "parcial") {
        throw new BadRequestException("La transacción no está en estado parcial");
      }
      if (syncTx.id_persona_pagador === null) {
        throw new BadRequestException("La transacción no tiene persona pagadora vinculada");
      }

      await tx.pagos.create({
        data: {
          id_persona_pago: syncTx.id_persona_pagador,
          id_deportista_beneficiario: data.id_deportista,
          id_concepto: data.id_concepto,
          id_transaccion_caja: syncTx.id_transaccion_caja,
          monto_pagado: data.monto,
          fecha_pago: syncTx.fecha_pago,
          mes_correspondiente: data.mes_correspondiente,
          gestion: syncTx.fecha_pago.getFullYear(),
          estado_factura: "Activa",
          id_transaccion_sync: idSyncTransaccion,
        },
      });

      await tx.transaccion_sync.update({
        where: { id_sync_transaccion: idSyncTransaccion },
        data: { estado_sync: "procesado" },
      });
    });
  }

  @Cron(CronExpression.EVERY_30_MINUTES, { name: "pagosSync", disabled: true })
  async cronSync() {
    if (process.env.PAGOS_SYNC_CRON_ENABLED !== "true") return;
    this.logger.log("Ejecutando sincronización automática programada...");
    await this.sync();
  }
}
