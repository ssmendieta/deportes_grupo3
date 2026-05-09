import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDeportistaDto } from "./dto/create-deportista.dto";

@Injectable()
export class DeportistasService {
  constructor(private prisma: PrismaService) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async calcularEstadoCuenta(
    deportistaId: number,
    anio: number,
    tipo: string,
  ): Promise<{ estado_cuenta: string; deuda: number }> {
    const tiposNoAplica = ["estudiante_ucb", "competitivo", "curso_gratuito"];
    if (tiposNoAplica.includes(tipo)) {
      return { estado_cuenta: "no_aplica", deuda: 0 };
    }

    const planilla = await this.prisma.planillaPagosAcademia.findUnique({
      where: { deportista_id_anio: { deportista_id: deportistaId, anio } },
    });

    if (!planilla) return { estado_cuenta: "pendiente", deuda: 0 };

    const mesActual = new Date().getMonth();
    const indiceMesAcademico = mesActual - 2;

    const camposMes: (keyof typeof planilla)[] = [
      "mes_1_pagado",
      "mes_2_pagado",
      "mes_3_pagado",
      "mes_4_pagado",
      "mes_5_pagado",
      "mes_6_pagado",
      "mes_7_pagado",
      "mes_8_pagado",
      "mes_9_pagado",
    ];

    const mesesDebidos = camposMes.slice(0, indiceMesAcademico + 1);
    const mesesPendientes = mesesDebidos.filter((campo) => !planilla[campo]);
    const deuda = Number(planilla.saldo_pendiente);

    if (mesesPendientes.length === 0 && planilla.matricula_pagada) {
      return { estado_cuenta: "al_dia", deuda: 0 };
    }

    return { estado_cuenta: "pendiente", deuda };
  }

  private async enriquecerDeportista(deportista: any) {
    const anio = new Date().getFullYear();
    const { estado_cuenta, deuda } = await this.calcularEstadoCuenta(
      deportista.id,
      anio,
      deportista.tipo, // 👈 agregar esto
    );
    return {
      ...deportista,
      estado_cuenta,
      deuda: estado_cuenta === "al_dia" ? 0 : deuda,
    };
  }

  // ─── Queries ─────────────────────────────────────────────────────────────────

  async findAll(
    page = 1,
    limit = 20,
    tipo?: string,
    disciplinaId?: string,
    activo?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

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

    const data = await Promise.all(
      rawData.map((d) => this.enriquecerDeportista(d)),
    );

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
    return this.enriquecerDeportista(deportista);
  }

  async buscarPorCi(ci: string) {
    const deportista = await this.prisma.deportista.findUnique({
      where: { ci },
    });
    if (!deportista)
      throw new NotFoundException(`Deportista con CI ${ci} no encontrado`);
    return this.enriquecerDeportista(deportista);
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
