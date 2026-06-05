import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePagoDto } from "./dto/create-pago.dto";
import { MESES_ACADEMICOS, MESES_NOMBRES } from "../common/constants/business.constants";

@Injectable()
export class PagosService {
  private readonly logger = new Logger(PagosService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    const [pagos, total] = await Promise.all([
      this.prisma.pagos.findMany({
        include: { conceptos_pago: true },
        orderBy: { fecha_pago: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.pagos.count(),
    ]);
    return {
      data: pagos.map((p: any) => this.mapPago(p)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  private mapPago(p: any) {
    return {
      id: p.id_pago,
      id_pago: p.id_pago,
      id_persona_pago: p.id_persona_pago,
      id_deportista_beneficiario: p.id_deportista_beneficiario,
      id_concepto: p.id_concepto,
      id_transaccion_caja: p.id_transaccion_caja,
      monto_pagado: Number(p.monto_pagado),
      monto: Number(p.monto_pagado),
      fecha_pago: p.fecha_pago,
      mes_correspondiente: p.mes_correspondiente,
      gestion: p.gestion,
      estado_factura: p.estado_factura,
      estado: p.estado_factura,
      concepto: p.conceptos_pago
        ? { id: p.conceptos_pago.id_concepto, nombre: p.conceptos_pago.nombre }
        : null,
    };
  }

  async getConceptos(disciplina_id?: number) {
    const where: any = { activo: true };
    if (disciplina_id) where.id_disciplina = disciplina_id;

    const data = await this.prisma.conceptos_pago.findMany({
      where,
      include: { disciplinas: true },
      orderBy: { id_concepto: "asc" },
    });
    return data.map((c: any) => ({
      id: c.id_concepto,
      nombre: c.nombre,
      monto: Number(c.monto_actual),
      activo: c.activo,
      disciplina_id: c.id_disciplina,
      disciplina_nombre: c.disciplinas?.nombre_disciplina ?? null,
    }));
  }

  async getPlanilla(disciplina_id: number, gestion: number) {
    const inscripciones = await this.prisma.inscripciones.findMany({
      where: {
        id_disciplina: disciplina_id,
        estado: "activo",
      },
    });

    const deportistaIds = inscripciones.map((i: any) => i.id_deportista);

    if (deportistaIds.length === 0) return [];

    const registros = await this.prisma.planillaPagosAcademia.findMany({
      where: {
        deportista_id: { in: deportistaIds },
        gestion,
      },
    });

    const registrosMap = new Map(
      registros.map((r: any) => [r.deportista_id, r]),
    );

    return inscripciones.map((inscripcion: any) => {
      const registro = registrosMap.get(inscripcion.id_deportista);
      return {
        deportista_id: inscripcion.id_deportista,
        planilla: registro ?? {
          deportista_id: inscripcion.id_deportista,
          gestion,
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
    });
  }

  async getMorosos(disciplina_id?: number, gestion?: number) {
    const gestionConsulta = gestion ?? new Date().getFullYear();

    let registros: any[] = await this.prisma.planillaPagosAcademia.findMany({
      where: {
        gestion: gestionConsulta,
        OR: [
          { matricula_pagada: false },
          ...MESES_ACADEMICOS.map((m) => ({ [`mes_${m}_pagado`]: false })),
        ],
      },
    });

    let deportistaIdsFilter: number[] | null = null;
    if (disciplina_id) {
      const inscripciones = await this.prisma.inscripciones.findMany({
        where: { id_disciplina: disciplina_id, estado: "activo" },
      });
      deportistaIdsFilter = inscripciones.map((i: any) => i.id_deportista);
      registros = registros.filter((r: any) =>
        deportistaIdsFilter!.includes(r.deportista_id),
      );
    }

    const resultado = registros.map((r: any) => {
      const mesesPendientes = MESES_ACADEMICOS
        .filter((m) => !r[`mes_${m}_pagado`])
        .map((m) => MESES_NOMBRES[m].substring(0, 3).replace(/^(.)/, (_, c) => c.toUpperCase()));

      return {
        deportista_id: r.deportista_id,
        nombre_completo: r.nombre_completo,
        tipo_deportista: r.tipo_deportista,
        matricula_pendiente: !r.matricula_pagada,
        meses_pendientes: mesesPendientes,
        cantidad_meses_pendientes: mesesPendientes.length,
        saldo_pendiente: Number(r.saldo_pendiente),
      };
    });

    return resultado.sort(
      (a: any, b: any) => b.saldo_pendiente - a.saldo_pendiente,
    );
  }

  async getPagosDeportista(deportista_id: number) {
    const deportista = await this.prisma.deportistas.findUnique({
      where: { id_deportista: deportista_id },
    });

    if (!deportista) {
      throw new NotFoundException(
        `Deportista con id ${deportista_id} no encontrado`,
      );
    }

    const pagos = await this.prisma.pagos.findMany({
      where: { id_deportista_beneficiario: deportista_id },
      include: { conceptos_pago: true },
      orderBy: { fecha_pago: "desc" },
    });

    return pagos.map((p: any) => this.mapPago(p));
  }

  async registrarPago(dto: CreatePagoDto) {
    const deportista = await this.prisma.deportistas.findUnique({
      where: { id_deportista: dto.id_deportista_beneficiario },
    });
    if (!deportista) {
      throw new NotFoundException(
        `Deportista con id ${dto.id_deportista_beneficiario} no encontrado`,
      );
    }

    const concepto = await this.prisma.conceptos_pago.findUnique({
      where: { id_concepto: dto.id_concepto },
    });
    if (!concepto) {
      throw new NotFoundException(
        `Concepto de pago con id ${dto.id_concepto} no encontrado`,
      );
    }

    const persona = await this.prisma.personas.findUnique({
      where: { id_persona: dto.id_persona_pago },
    });
    if (!persona) {
      throw new NotFoundException(
        `Persona con id ${dto.id_persona_pago} no encontrada`,
      );
    }

    const pagoExistente = await this.prisma.pagos.findFirst({
      where: {
        id_deportista_beneficiario: dto.id_deportista_beneficiario,
        id_concepto: dto.id_concepto,
        mes_correspondiente: dto.mes_correspondiente,
        gestion: dto.gestion,
        estado_factura: "Activa",
      },
    });
    if (pagoExistente) {
      throw new ConflictException(
        `Ya existe un pago registrado para el mes ${dto.mes_correspondiente} de la gestión ${dto.gestion}`,
      );
    }

    this.logger.log(
      `Registrando pago: deportista #${dto.id_deportista_beneficiario}, concepto #${dto.id_concepto}, monto ${dto.monto_pagado}`,
    );

    const pago = await this.prisma.pagos.create({
      data: {
        id_persona_pago: dto.id_persona_pago,
        id_deportista_beneficiario: dto.id_deportista_beneficiario,
        id_concepto: dto.id_concepto,
        id_transaccion_caja: dto.id_transaccion_caja,
        monto_pagado: dto.monto_pagado,
        fecha_pago: new Date(`${dto.fecha_pago}T12:00:00.000Z`),
        mes_correspondiente: dto.mes_correspondiente,
        gestion: dto.gestion,
        estado_factura: "Activa",
      },
      include: { conceptos_pago: true },
    });

    this.logger.log(`Pago registrado: #${pago.id_pago}`);

    return this.mapPago(pago);
  }

  async anularPago(id: number) {
    const pago = await this.prisma.pagos.findUnique({
      where: { id_pago: id },
    });

    if (!pago) {
      throw new NotFoundException(`Pago con id ${id} no encontrado`);
    }

    if (pago.estado_factura === "Anulado") {
      throw new ConflictException(`El pago con id ${id} ya está anulado`);
    }

    const pagoAnulado = await this.prisma.pagos.update({
      where: { id_pago: id },
      data: { estado_factura: "Anulado" },
      include: { conceptos_pago: true },
    });

    this.logger.log(`Pago anulado: #${id}`);

    return this.mapPago(pagoAnulado);
  }
}
