import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePagoDto } from "./dto/create-pago.dto";

@Injectable()
export class PagosService {
  constructor(private prisma: PrismaService) {}

  // ─── Obtener todos los conceptos de pago ─────────────────────────────────
  async getConceptos(disciplina_id?: number) {
    return this.prisma.conceptoPago.findMany({
      where: {
        activo: true,
        ...(disciplina_id && { disciplina_id }),
      },
      include: { disciplina: true },
      orderBy: { id: "asc" },
    });
  }

  // ─── Obtener planilla de pagos por disciplina y año ───────────────────────
  async getPlanilla(disciplina_id: number, anio: number) {
    // Traer todos los deportistas inscritos en esa disciplina
    const inscripciones = await this.prisma.inscripcion.findMany({
      where: {
        disciplina_id,
        estado: "activo",
      },
      include: {
        deportista: true,
      },
    });

    // Para cada deportista buscar o construir su planilla
    const planilla = await Promise.all(
      inscripciones.map(async (inscripcion) => {
        const registro = await this.prisma.planillaPagosAcademia.findUnique({
          where: {
            deportista_id_anio: {
              deportista_id: inscripcion.deportista_id,
              anio,
            },
          },
        });

        return {
          deportista: {
            id: inscripcion.deportista.id,
            nombre_completo: inscripcion.deportista.nombre_completo,
            ci: inscripcion.deportista.ci,
            tipo: inscripcion.deportista.tipo,
          },
          planilla: registro ?? {
            deportista_id: inscripcion.deportista_id,
            anio,
            matricula_pagada: false,
            mes_1_pagado: false,
            mes_2_pagado: false,
            mes_3_pagado: false,
            mes_4_pagado: false,
            mes_5_pagado: false,
            mes_6_pagado: false,
            mes_7_pagado: false,
            mes_8_pagado: false,
            mes_9_pagado: false,
            total_pagado: 0,
            saldo_pendiente: 0,
          },
        };
      }),
    );

    return planilla;
  }

  // ─── Obtener morosos ──────────────────────────────────────────────────────
  async getMorosos(disciplina_id?: number, anio?: number) {
    const anioConsulta = anio ?? new Date().getFullYear();

    const where: any = {
      anio: anioConsulta,
      OR: [
        { matricula_pagada: false },
        { mes_1_pagado: false },
        { mes_2_pagado: false },
        { mes_3_pagado: false },
        { mes_4_pagado: false },
        { mes_5_pagado: false },
        { mes_6_pagado: false },
        { mes_7_pagado: false },
        { mes_8_pagado: false },
        { mes_9_pagado: false },
      ],
    };

    const planillas = await this.prisma.planillaPagosAcademia.findMany({
      where,
      include: {
        deportista: {
          include: {
            inscripciones: {
              where: {
                estado: "activo",
                ...(disciplina_id && { disciplina_id }),
              },
              include: { disciplina: true },
            },
          },
        },
      },
    });

    // Filtrar los que tienen inscripción en la disciplina solicitada
    const resultado = planillas
      .filter((p) => p.deportista.inscripciones.length > 0)
      .map((p) => {
        const mesesPendientes = [
          !p.mes_1_pagado && "Mar",
          !p.mes_2_pagado && "Abr",
          !p.mes_3_pagado && "May",
          !p.mes_4_pagado && "Jun",
          !p.mes_5_pagado && "Jul",
          !p.mes_6_pagado && "Ago",
          !p.mes_7_pagado && "Sep",
          !p.mes_8_pagado && "Oct",
          !p.mes_9_pagado && "Nov",
        ].filter(Boolean);

        return {
          deportista_id: p.deportista_id,
          nombre_completo: p.deportista.nombre_completo,
          ci: p.deportista.ci,
          disciplina: p.deportista.inscripciones[0]?.disciplina.nombre,
          matricula_pendiente: !p.matricula_pagada,
          meses_pendientes: mesesPendientes,
          cantidad_meses_pendientes: mesesPendientes.length,
          saldo_pendiente: Number(p.saldo_pendiente),
        };
      })
      .sort((a, b) => b.saldo_pendiente - a.saldo_pendiente);

    return resultado;
  }

  // ─── Historial de pagos de un deportista ─────────────────────────────────
  async getPagosDeportista(deportista_id: number) {
    const deportista = await this.prisma.deportista.findUnique({
      where: { id: deportista_id },
    });

    if (!deportista) {
      throw new NotFoundException(
        `Deportista con id ${deportista_id} no encontrado`,
      );
    }

    return this.prisma.pago.findMany({
      where: { deportista_id },
      include: { concepto: true },
      orderBy: { fecha_pago: "desc" },
    });
  }

  // ─── Registrar un pago ────────────────────────────────────────────────────
  async registrarPago(dto: CreatePagoDto, registrado_por?: number) {
    // Verificar que el deportista existe
    const deportista = await this.prisma.deportista.findUnique({
      where: { id: dto.deportista_id },
    });
    if (!deportista) {
      throw new NotFoundException(
        `Deportista con id ${dto.deportista_id} no encontrado`,
      );
    }

    // Verificar que el concepto existe
    const concepto = await this.prisma.conceptoPago.findUnique({
      where: { id: dto.concepto_id },
    });
    if (!concepto) {
      throw new NotFoundException(
        `Concepto de pago con id ${dto.concepto_id} no encontrado`,
      );
    }

    // Verificar que no existe ya un pago confirmado para ese mes/año
    if (dto.mes) {
      const pagoExistente = await this.prisma.pago.findFirst({
        where: {
          deportista_id: dto.deportista_id,
          concepto_id: dto.concepto_id,
          mes: dto.mes,
          anio: dto.anio,
          estado: "confirmado",
        },
      });
      if (pagoExistente) {
        throw new ConflictException(
          `Ya existe un pago registrado para el mes ${dto.mes} del año ${dto.anio}`,
        );
      }
    }

    // Crear el pago y actualizar la planilla en una transacción
    const resultado = await this.prisma.$transaction(async (tx) => {
      // 1. Crear el pago
      const pago = await tx.pago.create({
        data: {
          deportista_id: dto.deportista_id,
          concepto_id: dto.concepto_id,
          monto: dto.monto,
          mes: dto.mes,
          anio: dto.anio,
          fecha_pago: new Date(`${dto.fecha_pago}T12:00:00.000Z`),
          comprobante: dto.comprobante,
          observaciones: dto.observaciones,
          origen: "manual",
          estado: "confirmado",
          registrado_por: registrado_por ?? 0,
        },
        include: { concepto: true },
      });

      // 2. Actualizar la planilla
      const campoPlanilla = this.obtenerCampoPlanilla(dto.mes);

      if (campoPlanilla) {
        await tx.planillaPagosAcademia.upsert({
          where: {
            deportista_id_anio: {
              deportista_id: dto.deportista_id,
              anio: dto.anio,
            },
          },
          update: {
            [campoPlanilla]: true,
            total_pagado: { increment: dto.monto },
            saldo_pendiente: { decrement: dto.monto },
          },
          create: {
            deportista_id: dto.deportista_id,
            anio: dto.anio,
            [campoPlanilla]: true,
            total_pagado: dto.monto,
            saldo_pendiente: 0,
          },
        });
      }

      return pago;
    });

    return resultado;
  }

  // ─── Anular un pago ───────────────────────────────────────────────────────
  async anularPago(id: number) {
    const pago = await this.prisma.pago.findUnique({
      where: { id },
    });

    if (!pago) {
      throw new NotFoundException(`Pago con id ${id} no encontrado`);
    }

    if (pago.estado === "anulado") {
      throw new ConflictException(`El pago con id ${id} ya está anulado`);
    }

    const resultado = await this.prisma.$transaction(async (tx) => {
      // 1. Anular el pago
      const pagoAnulado = await tx.pago.update({
        where: { id },
        data: { estado: "anulado" },
        include: { concepto: true },
      });

      // 2. Revertir en la planilla
      const campoPlanilla = this.obtenerCampoPlanilla(pago.mes ?? undefined);

      if (campoPlanilla) {
        await tx.planillaPagosAcademia.updateMany({
          where: {
            deportista_id: pago.deportista_id,
            anio: pago.anio ?? new Date().getFullYear(),
          },
          data: {
            [campoPlanilla]: false,
            total_pagado: { decrement: Number(pago.monto) },
            saldo_pendiente: { increment: Number(pago.monto) },
          },
        });
      }

      return pagoAnulado;
    });

    return resultado;
  }

  // ─── Helper: obtener campo de planilla según mes ──────────────────────────
  private obtenerCampoPlanilla(mes?: number): string | null {
    const campos: Record<number, string> = {
      1: "mes_1_pagado",
      2: "mes_2_pagado",
      3: "mes_3_pagado",
      4: "mes_4_pagado",
      5: "mes_5_pagado",
      6: "mes_6_pagado",
      7: "mes_7_pagado",
      8: "mes_8_pagado",
      9: "mes_9_pagado",
    };
    if (!mes) return "matricula_pagada";
    return campos[mes] ?? null;
  }
}
