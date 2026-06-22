import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDeportistaDto } from "./dto/create-deportista.dto";
import {
  DEPORTISTA_ROL,
} from "../common/constants/business.constants";
import { calcularEstadoCuenta, PlanillaParaEstado } from "../common/helpers/estado-cuenta.helper";

type PlanillaMap = Map<number, PlanillaParaEstado>;

@Injectable()
export class DeportistasService {
  constructor(private prisma: PrismaService) {}

  private async cargarPlanillas(deportistaIds: number[]): Promise<PlanillaMap> {
    if (deportistaIds.length === 0) return new Map();
    const gestion = new Date().getFullYear();
    const planillas: any[] = await this.prisma.$queryRaw`
      SELECT * FROM "PlanillaPagosAcademia"
      WHERE deportista_id = ANY(${deportistaIds}::int[])
      AND gestion = ${gestion}
    `;
    const map: PlanillaMap = new Map();
    for (const p of planillas) {
      map.set(p.deportista_id, p as unknown as PlanillaParaEstado);
    }
    return map;
  }

  private mapDeportistaRaw(raw: any, planillaMap: PlanillaMap) {
    const planilla = planillaMap.get(raw.id_deportista) ?? null;
    const { estado_cuenta, deuda } = calcularEstadoCuenta(
      raw.tipo_deportista,
      planilla,
    );
    const persona = raw.persona;
    return {
      id: raw.id_deportista,
      id_deportista: raw.id_deportista,
      id_persona: raw.id_persona,
      nombres: persona?.nombres ?? null,
      ape_paterno: persona?.ape_paterno ?? null,
      ape_materno: persona?.ape_materno ?? null,
      nombre_completo: `${persona?.nombres ?? ""} ${persona?.ape_paterno ?? ""} ${persona?.ape_materno ?? ""}`.trim(),
      tipo: raw.tipo_deportista,
      tipo_deportista: raw.tipo_deportista,
      ci: persona?.ci,
      complemento: persona?.complemento,
      celular: persona?.celular,
      fecha_nacimiento: persona?.fecha_nacimiento,
      email: raw.usuario?.email,
      talla_ropa: raw.talla_ropa,
      url_foto: raw.url_foto,
      activo: raw.usuario?.activo ?? true,
      id_carrera: raw.deportistas_ucb?.[0]?.id_carrera ?? null,
      carrera: raw.deportistas_ucb?.[0]?.carreras?.nombre ?? null,
      semestre: raw.deportistas_ucb?.[0]?.semestre ?? null,
      est_regular: raw.deportistas_ucb?.[0]?.est_regular ?? null,
      colegio_instituto: raw.deportistas_externos?.[0]?.colegio_instituto ?? null,
      curso: raw.deportistas_externos?.[0]?.curso ?? null,
      inscripciones: raw.inscripciones?.map((ins: any) => ({
        id: ins.id_inscripcion,
        id_inscripcion: ins.id_inscripcion,
        deportista_id: raw.id_deportista,
        disciplina_id: ins.id_disciplina,
        categoria: ins.categorias?.nombre_categoria ?? null,
        id_categoria: ins.id_categoria,
        fecha_inscripcion: ins.fecha_inscripcion,
        estado: ins.estado,
        disciplina: ins.disciplinas
          ? {
              id: ins.disciplinas.id_disciplina,
              nombre: ins.disciplinas.nombre_disciplina,
              activo: ins.disciplinas.activo,
            }
          : null,
      })) ?? [],
      estado_cuenta,
      deuda,
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
    const where: Record<string, unknown> = {};

    if (tipo) where.tipo_deportista = tipo;
    if (activo !== undefined) {
      const activoBool = activo === "true";
      where.OR = [
        { persona: { usuarios: { some: { activo: activoBool } } } },
        { persona: { usuarios: { none: {} } } },
      ];
    }
    if (disciplinaId) {
      where.inscripciones = {
        some: { id_disciplina: parseInt(disciplinaId), estado: "activo" },
      };
    }

    const [rawData, total] = await Promise.all([
      this.prisma.deportistas.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          persona: true,
          deportistas_ucb: { include: { carreras: true } },
          deportistas_externos: true,
          inscripciones: {
            where: { estado: "activo" },
            include: { categorias: true, disciplinas: true },
          },
          pagos: { take: 1 },
        },
      }),
      this.prisma.deportistas.count({ where }),
    ]);

    const deportistaIds = rawData.map((d: any) => d.id_deportista);
    const planillaMap = await this.cargarPlanillas(deportistaIds);

    const data = rawData.map((d: any) => this.mapDeportistaRaw(d, planillaMap));

    return { data, total, page: Number(page), limit: Number(limit) };
  }

  async findOne(id: number) {
    const raw = await this.prisma.deportistas.findUnique({
      where: { id_deportista: id },
      include: {
        persona: true,
        deportistas_ucb: { include: { carreras: true } },
        deportistas_externos: true,
        inscripciones: {
          include: { categorias: true, disciplinas: true },
        },
        pagos: { take: 1 },
      },
    });
    if (!raw) throw new NotFoundException(`Deportista #${id} no encontrado`);
    const planillaMap = await this.cargarPlanillas([id]);
    return this.mapDeportistaRaw(raw, planillaMap);
  }

  async buscarPorCi(ci: string) {
    const ciNum = parseInt(ci, 10);
    if (isNaN(ciNum)) throw new NotFoundException(`CI inválido: ${ci}`);

    const persona = await this.prisma.personas.findUnique({
      where: { ci: ciNum },
    });
    if (!persona)
      throw new NotFoundException(`No existe persona con CI ${ci}`);

    const raw = await this.prisma.deportistas.findFirst({
      where: { id_persona: persona.id_persona },
      include: {
        persona: true,
        deportistas_ucb: { include: { carreras: true } },
        deportistas_externos: true,
        inscripciones: {
          where: { estado: "activo" },
          include: { categorias: true, disciplinas: true },
        },
      },
    });
    if (!raw)
      throw new NotFoundException(`No hay deportista asociado al CI ${ci}`);

    const planillaMap = await this.cargarPlanillas([raw.id_deportista]);
    return this.mapDeportistaRaw(raw, planillaMap);
  }

  async create(dto: CreateDeportistaDto) {
    const ciNum = Number(dto.ci);
    const existePersona = await this.prisma.personas.findUnique({
      where: { ci: ciNum },
    });
    if (existePersona) {
      throw new ConflictException(`El CI ${ciNum} ya está registrado en PERSONAS`);
    }

    return this.prisma.$transaction(async (tx: any) => {
      const persona = await tx.personas.create({
        data: {
          nombres: dto.nombres,
          ape_paterno: dto.ape_paterno,
          ape_materno: dto.ape_materno,
          ci: ciNum,
          complemento: dto.complemento ?? null,
          celular: dto.celular,
          fecha_nacimiento: new Date(dto.fecha_nacimiento),
        },
      });

      if (dto.email) {
        const rol = await tx.roles.findFirst({
          where: { nombre_rol: DEPORTISTA_ROL },
        });
        const idRol = rol?.id_rol ?? (
          await tx.roles.create({
            data: { nombre_rol: DEPORTISTA_ROL, descripcion: "Deportista del sistema" },
          })
        ).id_rol;

        await tx.usuarios.create({
          data: {
            id_persona: persona.id_persona,
            id_rol: idRol,
            email: dto.email,
            hash_password: "",
            activo: true,
          },
        });
      }

      const deportista = await tx.deportistas.create({
        data: {
          id_persona: persona.id_persona,
          tipo_deportista: dto.tipo_deportista,
          talla_ropa: dto.talla_ropa ?? null,
        },
      });

      if (dto.tipo_deportista === "estudiante_ucb" && dto.id_carrera) {
        await tx.deportistas_ucb.create({
          data: {
            id_deportista: deportista.id_deportista,
            id_carrera: dto.id_carrera,
            semestre: dto.semestre ?? 1,
            est_regular: dto.est_regular ?? false,
          },
        });
      }

      if (dto.tipo_deportista === "competitivo") {
        await tx.deportistas_externos.create({
          data: {
            id_deportista: deportista.id_deportista,
            colegio_instituto: dto.colegio_instituto ?? null,
            curso: dto.curso ?? null,
          },
        });
      }

      if (dto.disciplinaId) {
        await tx.inscripciones.create({
          data: {
            id_deportista: deportista.id_deportista,
            id_disciplina: dto.disciplinaId,
            id_categoria: dto.id_categoria ?? 1,
            fecha_inscripcion: new Date(),
            estado: "activo",
          },
        });
      }

      const created = await tx.deportistas.findUnique({
        where: { id_deportista: deportista.id_deportista },
        include: {
          persona: true,
          deportistas_ucb: { include: { carreras: true } },
          deportistas_externos: true,
          inscripciones: {
            include: { categorias: true, disciplinas: true },
          },
        },
      });

      const planillaMap = await this.cargarPlanillas([created.id_deportista]);
      return this.mapDeportistaRaw(created, planillaMap);
    });
  }

  async update(id: number, dto: any) {
    const raw = await this.prisma.deportistas.findUnique({
      where: { id_deportista: id },
      include: { persona: true },
    });
    if (!raw) throw new NotFoundException(`Deportista #${id} no encontrado`);

    return this.prisma.$transaction(async (tx: any) => {
      const personaUpdate: Record<string, unknown> = {};
      if (dto.nombres !== undefined) personaUpdate.nombres = dto.nombres;
      if (dto.ape_paterno !== undefined) personaUpdate.ape_paterno = dto.ape_paterno;
      if (dto.ape_materno !== undefined) personaUpdate.ape_materno = dto.ape_materno;
      if (dto.ci !== undefined) {
        const ciNum = Number(dto.ci);
        const exists = await tx.personas.findUnique({ where: { ci: ciNum } });
        if (exists && exists.id_persona !== raw.id_persona) {
          throw new ConflictException(`El CI ${ciNum} ya está registrado`);
        }
        personaUpdate.ci = ciNum;
      }
      if (dto.complemento !== undefined) personaUpdate.complemento = dto.complemento;
      if (dto.celular !== undefined) personaUpdate.celular = dto.celular;
      if (dto.fecha_nacimiento !== undefined) personaUpdate.fecha_nacimiento = new Date(dto.fecha_nacimiento);

      if (Object.keys(personaUpdate).length > 0) {
        await tx.personas.update({
          where: { id_persona: raw.id_persona },
          data: personaUpdate,
        });
      }

      const depUpdate: Record<string, unknown> = {};
      if (dto.tipo_deportista !== undefined) depUpdate.tipo_deportista = dto.tipo_deportista;
      if (dto.talla_ropa !== undefined) depUpdate.talla_ropa = dto.talla_ropa;
      if (Object.keys(depUpdate).length > 0) {
        await tx.deportistas.update({
          where: { id_deportista: id },
          data: depUpdate,
        });
      }

      if (dto.email !== undefined) {
        const existingUser = await tx.usuarios.findFirst({
          where: { id_persona: raw.id_persona },
        });
        if (existingUser) {
          await tx.usuarios.update({
            where: { id_usuario: existingUser.id_usuario },
            data: { email: dto.email },
          });
        } else if (dto.email) {
          const rol = await tx.roles.findFirst({
            where: { nombre_rol: DEPORTISTA_ROL },
          });
          const idRol = rol?.id_rol ?? (
            await tx.roles.create({
              data: { nombre_rol: DEPORTISTA_ROL, descripcion: "Deportista del sistema" },
            })
          ).id_rol;
          await tx.usuarios.create({
            data: {
              id_persona: raw.id_persona,
              id_rol: idRol,
              email: dto.email,
              hash_password: "",
              activo: true,
            },
          });
        }
      }

      if (dto.tipo_deportista === "estudiante_ucb" || dto.id_carrera !== undefined || dto.semestre !== undefined) {
        const existing = await tx.deportistas_ucb.findFirst({
          where: { id_deportista: id },
        });
        const ucbData: Record<string, unknown> = {};
        if (dto.id_carrera !== undefined) ucbData.id_carrera = dto.id_carrera;
        if (dto.semestre !== undefined) ucbData.semestre = dto.semestre;
        if (dto.est_regular !== undefined) ucbData.est_regular = dto.est_regular;
        if (existing) {
          if (Object.keys(ucbData).length > 0) {
            await tx.deportistas_ucb.update({
              where: { id_deportista_ucb: existing.id_deportista_ucb },
              data: ucbData,
            });
          }
        } else if (dto.tipo_deportista === "estudiante_ucb" && dto.id_carrera) {
          await tx.deportistas_ucb.create({
            data: {
              id_deportista: id,
              id_carrera: dto.id_carrera,
              semestre: dto.semestre ?? 1,
              est_regular: dto.est_regular ?? false,
            },
          });
        }
      }

      if (dto.tipo_deportista === "competitivo" || dto.colegio_instituto !== undefined) {
        const existing = await tx.deportistas_externos.findFirst({
          where: { id_deportista: id },
        });
        const extData: Record<string, unknown> = {};
        if (dto.colegio_instituto !== undefined) extData.colegio_instituto = dto.colegio_instituto;
        if (dto.curso !== undefined) extData.curso = dto.curso;
        if (existing) {
          if (Object.keys(extData).length > 0) {
            await tx.deportistas_externos.update({
              where: { id_deportista_ext: existing.id_deportista_ext },
              data: extData,
            });
          }
        } else if (dto.tipo_deportista === "competitivo") {
          await tx.deportistas_externos.create({
            data: {
              id_deportista: id,
              colegio_instituto: dto.colegio_instituto ?? null,
              curso: dto.curso ?? null,
            },
          });
        }
      }

      if (dto.disciplinaId) {
        const activeInsc = await tx.inscripciones.findFirst({
          where: { id_deportista: id, estado: "activo" },
        });
        const inscData: Record<string, unknown> = { id_disciplina: dto.disciplinaId };
        if (dto.id_categoria !== undefined) inscData.id_categoria = dto.id_categoria;
        if (activeInsc) {
          await tx.inscripciones.update({
            where: { id_inscripcion: activeInsc.id_inscripcion },
            data: inscData,
          });
        } else {
          await tx.inscripciones.create({
            data: {
              id_deportista: id,
              ...inscData,
              fecha_inscripcion: new Date(),
              estado: "activo",
            } as any,
          });
        }
      }

      const updated = await tx.deportistas.findUnique({
        where: { id_deportista: id },
        include: {
          persona: true,
          deportistas_ucb: { include: { carreras: true } },
          deportistas_externos: true,
          inscripciones: {
            include: { categorias: true, disciplinas: true },
          },
        },
      });

      const planillaMap = await this.cargarPlanillas([id]);
      return this.mapDeportistaRaw(updated, planillaMap);
    });
  }

  async cambiarEstado(id: number, activo: boolean) {
    const raw = await this.prisma.deportistas.findUnique({
      where: { id_deportista: id },
      include: { persona: { include: { usuarios: true } } },
    });
    if (!raw) throw new NotFoundException(`Deportista #${id} no encontrado`);

    const usuario = raw.persona?.usuarios?.[0];
    if (!usuario) {
      throw new NotFoundException(`Deportista #${id} no tiene usuario asociado`);
    }

    return this.prisma.usuarios.update({
      where: { id_usuario: usuario.id_usuario },
      data: { activo },
    });
  }

  async inscribir(
    deportistaId: number,
    body: { disciplinaId: number; id_categoria: number },
  ) {
    const raw = await this.prisma.deportistas.findUnique({
      where: { id_deportista: deportistaId },
    });
    if (!raw) throw new NotFoundException(`Deportista #${deportistaId} no encontrado`);

    const disciplina = await this.prisma.disciplinas.findUnique({
      where: { id_disciplina: body.disciplinaId },
    });
    if (!disciplina) {
      throw new NotFoundException(`La disciplina #${body.disciplinaId} no existe`);
    }

    const categoria = await this.prisma.categorias.findUnique({
      where: { id_categoria: body.id_categoria },
    });
    if (!categoria) {
      throw new NotFoundException(`La categoría #${body.id_categoria} no existe`);
    }

    const existeInscripcion = await this.prisma.inscripciones.findFirst({
      where: {
        id_deportista: deportistaId,
        id_disciplina: body.disciplinaId,
        id_categoria: body.id_categoria,
        estado: "activo",
      },
    });
    if (existeInscripcion) {
      throw new ConflictException(
        "El deportista ya está inscrito activamente en esta disciplina/categoría",
      );
    }

    return this.prisma.inscripciones.create({
      data: {
        id_deportista: deportistaId,
        id_disciplina: body.disciplinaId,
        id_categoria: body.id_categoria,
        fecha_inscripcion: new Date(),
        estado: "activo",
      },
    });
  }

  async obtenerInscripciones(deportistaId: number) {
    return this.prisma.inscripciones.findMany({
      where: { id_deportista: deportistaId },
      include: {
        disciplinas: true,
        categorias: true,
      },
    });
  }
}
