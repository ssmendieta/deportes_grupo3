import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { CreatePagoDto } from "./dto/create-pago.dto";
import { MESES_ACADEMICOS, MESES_NOMBRES } from "../common/constants/business.constants";
import { calcularEstadoCuenta, PlanillaParaEstado, PlanillaVistaRow } from "../common/helpers/estado-cuenta.helper";

type DeportistaConCuenta = Prisma.deportistasGetPayload<{
  include: {
    persona: true;
    inscripciones: { where: { estado: "activo" }; include: { disciplinas: true } };
  };
}>;

type PagoConConcepto = Prisma.pagosGetPayload<{ include: { conceptos_pago: true } }>;

@Injectable()
export class PagosService {
  private readonly logger = new Logger(PagosService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Filtro de mes "negativo": el deportista debe tener planilla, haber pagado
   * matrícula y todos los meses académicos anteriores al seleccionado, y NO
   * haber pagado el mes seleccionado.
   *
   * El mes se interpreta como mes calendario (3=marzo, ..., 9=septiembre).
   */
  private cumpleFiltroMes(planilla: PlanillaParaEstado | null | undefined, mes?: number): boolean {
    if (!mes || mes < 3 || mes > 9) return true;
    if (!planilla || !planilla.matricula_pagada) return false;
    for (let m = 3; m < mes; m++) {
      if (!planilla[`mes_${m}_pagado` as keyof PlanillaParaEstado]) return false;
    }
    return !planilla[`mes_${mes}_pagado` as keyof PlanillaParaEstado];
  }

  private mapPlanilla(planilla: PlanillaParaEstado | null | undefined): PlanillaParaEstado | null {
    if (!planilla) return null;
    return {
      matricula_pagada: planilla.matricula_pagada,
      mes_1_pagado: planilla.mes_1_pagado,
      mes_2_pagado: planilla.mes_2_pagado,
      mes_3_pagado: planilla.mes_3_pagado,
      mes_4_pagado: planilla.mes_4_pagado,
      mes_5_pagado: planilla.mes_5_pagado,
      mes_6_pagado: planilla.mes_6_pagado,
      mes_7_pagado: planilla.mes_7_pagado,
      mes_8_pagado: planilla.mes_8_pagado,
      mes_9_pagado: planilla.mes_9_pagado,
      saldo_pendiente: Number(planilla.saldo_pendiente),
    };
  }

  private mapCuentaItem(d: DeportistaConCuenta, planilla: PlanillaParaEstado | null) {
    const { estado_cuenta, deuda } = calcularEstadoCuenta(d.tipo_deportista, planilla);
    return {
      id: d.id_deportista,
      nombreCompleto: `${d.persona?.nombres ?? ""} ${d.persona?.ape_paterno ?? ""} ${d.persona?.ape_materno ?? ""}`.trim(),
      ci: String(d.persona?.ci ?? ""),
      tipo: d.tipo_deportista,
      inscripciones: (d.inscripciones ?? []).map((i) => ({
        activo: i.estado === "activo",
        disciplinaId: i.id_disciplina,
        disciplinaNombre: i.disciplinas?.nombre_disciplina ?? null,
      })),
      estadoCuenta: estado_cuenta,
      deuda,
      planilla: this.mapPlanilla(planilla),
    };
  }

  /**
   * Lista de cuentas de academia con paginación real y filtros aplicados en la
   * base de datos. No carga todos los deportistas en memoria: primero obtiene
   * los IDs candidatos, carga solo sus planillas, filtra por mes/estado y luego
   * pagina los datos completos.
   */
  async getCuentasAcademia(params: {
    page?: number;
    limit?: number;
    busqueda?: string;
    disciplinaId?: number;
    mes?: number;
    anio?: number;
    estado?: string;
  }) {
    const page = Math.max(1, Number.isNaN(Number(params.page)) ? 1 : Number(params.page));
    const limit = Math.min(200, Math.max(1, Number.isNaN(Number(params.limit)) ? 7 : Number(params.limit)));
    const anio = params.anio ?? new Date().getFullYear();

    const where: Record<string, unknown> = { tipo_deportista: "academia", activo: true };

    if (params.disciplinaId) {
      where.inscripciones = {
        some: { id_disciplina: params.disciplinaId, estado: "activo" },
      };
    }

    if (params.busqueda) {
      const ci = parseInt(params.busqueda, 10);
      if (!isNaN(ci)) {
        const persona = await this.prisma.personas.findUnique({
          where: { ci },
          select: { id_persona: true },
        });
        where.id_persona = persona ? persona.id_persona : -1;
      } else {
        where.id_persona = -1;
      }
    }

    const candidatos = await this.prisma.deportistas.findMany({
      where,
      select: { id_deportista: true },
      orderBy: { id_deportista: "asc" },
    });

    const ids = candidatos.map((d: any) => d.id_deportista);

    if (ids.length === 0) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const planillas = await this.prisma.$queryRaw<PlanillaVistaRow[]>`
      SELECT * FROM "PlanillaPagosAcademia"
      WHERE deportista_id = ANY(${ids})
      AND gestion = ${anio}
    `;
    const planillaMap = new Map<number, PlanillaVistaRow>(
      planillas.map((p) => [p.deportista_id, p]),
    );

    const idsFiltrados = ids.filter((id) => {
      const planilla = planillaMap.get(id);
      if (params.mes && !this.cumpleFiltroMes(planilla, params.mes)) {
        return false;
      }
      if (params.estado && params.estado !== "todos") {
        const { estado_cuenta } = calcularEstadoCuenta("academia", planilla);
        if (estado_cuenta !== params.estado) return false;
      }
      return true;
    });

    const total = idsFiltrados.length;
    const paginatedIds = idsFiltrados.slice((page - 1) * limit, page * limit);

    if (paginatedIds.length === 0) {
      return { data: [], total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    const deportistas = await this.prisma.deportistas.findMany({
      where: { id_deportista: { in: paginatedIds } },
      include: {
        persona: true,
        inscripciones: {
          where: { estado: "activo" },
          include: { disciplinas: true },
        },
      },
      orderBy: { id_deportista: "asc" },
    });

    const data = deportistas.map((d: any) =>
      this.mapCuentaItem(d, planillaMap.get(d.id_deportista) ?? null),
    );

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

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
      data: pagos.map((p) => this.mapPago(p)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Versión del listado de pagos pensada para reportes. Aplica los filtros de
   * rango de fecha directamente en la base de datos y permite paginación real,
   * evitando traer miles de registros a memoria.
   */
  async findAllParaReporte(params: {
    page?: number;
    limit?: number;
    fechaDesde?: Date;
    fechaHasta?: Date;
  }) {
    const page = Math.max(1, Number.isNaN(Number(params.page)) ? 1 : Number(params.page));
    const limit = Math.min(2000, Math.max(1, Number.isNaN(Number(params.limit)) ? 1000 : Number(params.limit)));

    const where: Record<string, unknown> = {};
    if (params.fechaDesde || params.fechaHasta) {
      const filtroFecha: Record<string, Date> = {};
      if (params.fechaDesde) filtroFecha.gte = params.fechaDesde;
      if (params.fechaHasta) filtroFecha.lt = params.fechaHasta;
      where.fecha_pago = filtroFecha;
    }

    const [pagos, total] = await Promise.all([
      this.prisma.pagos.findMany({
        where,
        include: { conceptos_pago: true },
        orderBy: { fecha_pago: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.pagos.count({ where }),
    ]);

    return {
      data: pagos.map((p) => this.mapPago(p)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  private mapPago(p: PagoConConcepto) {
    return {
      id_pago: p.id_pago,
      id_persona_pago: p.id_persona_pago,
      id_deportista_beneficiario: p.id_deportista_beneficiario,
      id_concepto: p.id_concepto,
      id_transaccion_caja: p.id_transaccion_caja,
      monto_pagado: Number(p.monto_pagado),
      fecha_pago: p.fecha_pago,
      mes_correspondiente: p.mes_correspondiente,
      gestion: p.gestion,
      estado_factura: p.estado_factura,
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
      include: {
        deportistas: {
          include: { persona: true },
        },
      },
    });

    const deportistaIds = inscripciones.map((i: any) => i.id_deportista);

    if (deportistaIds.length === 0) return [];

    const registros = await this.prisma.$queryRaw<PlanillaVistaRow[]>`
      SELECT * FROM "PlanillaPagosAcademia"
      WHERE deportista_id = ANY(${deportistaIds})
      AND gestion = ${gestion}
    `;

    const registrosMap = new Map(
      registros.map((r) => [r.deportista_id, r]),
    );

    return inscripciones.map((inscripcion) => {
      const registro = registrosMap.get(inscripcion.id_deportista);
      return {
        deportista_id: inscripcion.id_deportista,
        planilla: registro ?? {
          deportista_id: inscripcion.id_deportista,
          nombre_completo: inscripcion.deportistas?.persona
            ? `${inscripcion.deportistas.persona.nombres ?? ""} ${inscripcion.deportistas.persona.ape_paterno ?? ""} ${inscripcion.deportistas.persona.ape_materno ?? ""}`.trim()
            : null,
          tipo_deportista: inscripcion.deportistas?.tipo_deportista ?? null,
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

    const condicionesMes = MESES_ACADEMICOS
      .map((m) => `"mes_${m}_pagado" = false`)
      .join(" OR ");

    let deportistaIds: number[] | undefined;
    if (disciplina_id) {
      const inscripciones = await this.prisma.inscripciones.findMany({
        where: { id_disciplina: disciplina_id, estado: "activo" },
      });
      deportistaIds = inscripciones.map((i) => i.id_deportista);
      if (deportistaIds.length === 0) {
        return [];
      }
    }

    const registros = deportistaIds
      ? await this.prisma.$queryRaw<PlanillaVistaRow[]>`
          SELECT * FROM "PlanillaPagosAcademia"
          WHERE gestion = ${gestionConsulta}
            AND ("matricula_pagada" = false OR ${Prisma.sql([condicionesMes])})
            AND deportista_id = ANY(${deportistaIds})
        `
      : await this.prisma.$queryRaw<PlanillaVistaRow[]>`
          SELECT * FROM "PlanillaPagosAcademia"
          WHERE gestion = ${gestionConsulta}
            AND ("matricula_pagada" = false OR ${Prisma.sql([condicionesMes])})
        `;

    const resultado = registros.map((r) => {
      const mesesPendientes = MESES_ACADEMICOS
        .filter((m) => !r[`mes_${m}_pagado` as keyof PlanillaParaEstado])
        .map((m) => MESES_NOMBRES[m].substring(0, 3).replace(/^(.)/, (_, c: string) => c.toUpperCase()));

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

    return resultado.sort((a, b) => b.saldo_pendiente - a.saldo_pendiente);
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

    return pagos.map((p) => this.mapPago(p));
  }

  async registrarPago(dto: CreatePagoDto) {
    return this.prisma.$transaction(async (tx) => {
      const deportista = await tx.deportistas.findUnique({
        where: { id_deportista: dto.id_deportista_beneficiario },
      });
      if (!deportista) {
        throw new NotFoundException(
          `Deportista con id ${dto.id_deportista_beneficiario} no encontrado`,
        );
      }

      const concepto = await tx.conceptos_pago.findUnique({
        where: { id_concepto: dto.id_concepto },
      });
      if (!concepto) {
        throw new NotFoundException(
          `Concepto de pago con id ${dto.id_concepto} no encontrado`,
        );
      }

      const persona = await tx.personas.findUnique({
        where: { id_persona: dto.id_persona_pago },
      });
      if (!persona) {
        throw new NotFoundException(
          `Persona con id ${dto.id_persona_pago} no encontrada`,
        );
      }

      const pagoExistente = await tx.pagos.findFirst({
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

      const pago = await tx.pagos.create({
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
    });
  }

  async anularPago(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const pago = await tx.pagos.findUnique({
        where: { id_pago: id },
      });

      if (!pago) {
        throw new NotFoundException(`Pago con id ${id} no encontrado`);
      }

      if (pago.estado_factura === "Anulado") {
        throw new ConflictException(`El pago con id ${id} ya está anulado`);
      }

      const pagoAnulado = await tx.pagos.update({
        where: { id_pago: id },
        data: { estado_factura: "Anulado" },
        include: { conceptos_pago: true },
      });

      this.logger.log(`Pago anulado: #${id}`);

      return this.mapPago(pagoAnulado);
    });
  }

  async getTotalRecaudado(gestion?: number) {
    const result = await this.prisma.pagos.aggregate({
      where: {
        estado_factura: "Activa",
        ...(gestion ? { gestion } : {}),
      },
      _sum: { monto_pagado: true },
    });
    return { total: Number(result._sum.monto_pagado ?? 0) };
  }
}
