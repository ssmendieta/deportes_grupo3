import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDeportistaDto } from "./dto/create-deportista.dto";

type PlanillaMap = Map<number, { matricula_pagada: boolean; saldo_pendiente: number; [key: string]: unknown }>;

@Injectable()
export class DeportistasService {
  constructor(private prisma: PrismaService) {}

  private calcularEstadoCuenta(
    deportistaId: number,
    tipo: string,
    planillaMap: PlanillaMap,
  ): { estado_cuenta: string; deuda: number } {
    const anio = new Date().getFullYear();
    const tiposNoAplica = ["estudiante_ucb", "competitivo", "curso_gratuito"];
    if (tiposNoAplica.includes(tipo)) {
      return { estado_cuenta: "no_aplica", deuda: 0 };
    }

    const planilla = planillaMap.get(deportistaId);
    if (!planilla) return { estado_cuenta: "pendiente", deuda: 0 };

    const mesActual = new Date().getMonth();
    const indiceMesAcademico = mesActual - 2;
    const camposMes = [
      "mes_1_pagado", "mes_2_pagado", "mes_3_pagado",
      "mes_4_pagado", "mes_5_pagado", "mes_6_pagado",
      "mes_7_pagado", "mes_8_pagado", "mes_9_pagado",
    ] as const;

    const mesesDebidos = camposMes.slice(0, Math.max(0, indiceMesAcademico + 1));
    const mesesPendientes = mesesDebidos.filter((campo) => !planilla[campo]);
    const deuda = Number(planilla.saldo_pendiente);

    if (mesesPendientes.length === 0 && planilla.matricula_pagada) {
      return { estado_cuenta: "al_dia", deuda: 0 };
    }

    return { estado_cuenta: "pendiente", deuda };
  }

  private async cargarPlanillas(deportistaIds: number[]): Promise<PlanillaMap> {
    if (deportistaIds.length === 0) return new Map();
    const anio = new Date().getFullYear();
    const planillas = await this.prisma.planillaPagosAcademia.findMany({
      where: { deportista_id: { in: deportistaIds }, anio },
    });
    const map: PlanillaMap = new Map();
    for (const p of planillas) {
      map.set(p.deportista_id, p as unknown as PlanillaMap extends Map<number, infer V> ? V : never);
    }
    return map;
  }

  private enriquecerDeportista(deportista: any, planillaMap: PlanillaMap) {
    const { estado_cuenta, deuda } = this.calcularEstadoCuenta(
      deportista.id,
      deportista.tipo,
      planillaMap,
    );
    return {
      ...deportista,
      estado_cuenta,
      deuda: estado_cuenta === "al_dia" ? 0 : deuda,
    };
  }

  async findAll(
    page = 1,
    limit = 20,
    tipo?: string,
    disciplinaId?: string,
    activo?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.DeportistaWhereInput = {};

    if (tipo) where.tipo = tipo;
    if (activo === "true") where.activo = true;
    if (disciplinaId) {
      where.inscripciones = {
        some: { disciplina_id: parseInt(disciplinaId), estado: "activo" },
      };
    }

    const [rawData, total] = await Promise.all([
      this.prisma.deportista.findMany({
        where,
        skip,
        take: Number(limit),
        include: { inscripciones: { include: { disciplina: true } } },
      }),
      this.prisma.deportista.count({ where }),
    ]);

    const deportistaIds = rawData.map((d) => d.id);
    const planillaMap = await this.cargarPlanillas(deportistaIds);

    const data = rawData.map((d) => this.enriquecerDeportista(d, planillaMap));

    return { data, total, page: Number(page), limit: Number(limit) };
  }

  async findOne(id: number) {
    const deportista = await this.prisma.deportista.findUnique({
      where: { id },
      include: {
        inscripciones: {
          where: { estado: "activo" },
          include: { disciplina: true },
        },
      },
    });
    if (!deportista)
      throw new NotFoundException(`Deportista #${id} no encontrado`);
    const planillaMap = await this.cargarPlanillas([id]);
    return this.enriquecerDeportista(deportista, planillaMap);
  }

  async buscarPorCi(ci: string) {
    const deportista = await this.prisma.deportista.findUnique({
      where: { ci },
    });
    if (!deportista)
      throw new NotFoundException(`Deportista con CI ${ci} no encontrado`);
    const planillaMap = await this.cargarPlanillas([deportista.id]);
    return this.enriquecerDeportista(deportista, planillaMap);
  }

  async create(dto: CreateDeportistaDto) {
    const existe = await this.prisma.deportista.findUnique({
      where: { ci: dto.ci },
    });
    if (existe)
      throw new ConflictException(`El CI ${dto.ci} ya está registrado`);

    return this.prisma.$transaction(async (prisma) => {
      const nuevoDeportista = await prisma.deportista.create({
        data: {
          tipo: dto.tipo,
          ci: dto.ci,
          nombre_completo: dto.nombre_completo,
          carrera: dto.carrera,
          semestre: dto.semestre,
          fecha_nacimiento: dto.fecha_nacimiento
            ? new Date(dto.fecha_nacimiento)
            : null,
          genero: dto.genero,
          telefono: dto.telefono,
          email: dto.email,
        },
      });

      if (dto.disciplinaId) {
        await prisma.inscripcion.create({
          data: {
            deportista_id: nuevoDeportista.id,
            disciplina_id: dto.disciplinaId,
            categoria: dto.categoria,
            nivel: dto.nivel,
          },
        });
      }

      return nuevoDeportista;
    });
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    const { ci, tipo, ...updateData } = dto;
    return this.prisma.deportista.update({ where: { id }, data: updateData });
  }

  async cambiarEstado(id: number, activo: boolean) {
    await this.findOne(id);
    return this.prisma.deportista.update({ where: { id }, data: { activo } });
  }

  async inscribir(
    deportistaId: number,
    body: { disciplinaId: number; categoria?: string; nivel?: string },
  ) {
    await this.findOne(deportistaId);

    const disciplina = await this.prisma.disciplina.findUnique({
      where: { id: body.disciplinaId },
    });
    if (!disciplina) {
      throw new NotFoundException(
        `La disciplina #${body.disciplinaId} no existe`,
      );
    }

    const existeInscripcion = await this.prisma.inscripcion.findFirst({
      where: {
        deportista_id: deportistaId,
        disciplina_id: body.disciplinaId,
        categoria: body.categoria,
        estado: "activo",
      },
    });
    if (existeInscripcion) {
      throw new ConflictException(
        "El deportista ya está inscrito activamente en esta disciplina/categoría",
      );
    }

    return this.prisma.inscripcion.create({
      data: {
        deportista_id: deportistaId,
        disciplina_id: body.disciplinaId,
        categoria: body.categoria,
        nivel: body.nivel,
      },
    });
  }

  async obtenerInscripciones(deportistaId: number) {
    return this.prisma.inscripcion.findMany({
      where: { deportista_id: deportistaId },
      include: { disciplina: true },
    });
  }
}
