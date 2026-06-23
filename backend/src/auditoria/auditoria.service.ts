import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const TABLA_TO_TABLE: Record<string, { table: string; pk: string }> = {
  reserva: { table: "reservas", pk: "id_reserva" },
  deportista: { table: "deportistas", pk: "id_deportista" },
  inscripcion: { table: "inscripciones", pk: "id_inscripcion" },
  pago: { table: "pagos", pk: "id_pago" },
  disciplina: { table: "disciplinas", pk: "id_disciplina" },
  espacio: { table: "espacios", pk: "id_espacio" },
  horario: { table: "plantilla_horarios_fijos", pk: "id_plantilla" },
};

const SENSITIVE_FIELDS = new Set([
  "password",
  "hash_password",
  "token",
  "refresh_token",
  "secret",
  "contrasena",
  "contraseña",
]);

type AuditoriaQuery = {
  entidad?: string;
  usuario?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  limit?: number;
};

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(query: AuditoriaQuery) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(200, Math.max(1, Number(query.limit ?? 50)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.entidad) where.tabla = query.entidad;
    if (query.usuario) {
      const uid = Number(query.usuario);
      if (!Number.isNaN(uid)) where.id_usuario = uid;
    }
    if (query.desde || query.hasta) {
      where.fecha_auditoria = {};
      if (query.desde) {
        const desde = new Date(`${query.desde}T00:00:00.000Z`);
        if (!Number.isNaN(desde.getTime())) {
          (where.fecha_auditoria as Record<string, unknown>).gte = desde;
        }
      }
      if (query.hasta) {
        const hasta = new Date(`${query.hasta}T23:59:59.999Z`);
        if (!Number.isNaN(hasta.getTime())) {
          (where.fecha_auditoria as Record<string, unknown>).lte = hasta;
        }
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.auditoria.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fecha_auditoria: "desc" },
      }),
      this.prisma.auditoria.count({ where }),
    ]);

    return {
      data: data.map((a) => ({
        id: a.id_auditoria,
        fecha: a.fecha_auditoria,
        id_usuario: a.id_usuario,
        accion: a.accion,
        tabla: a.tabla,
        registro_id: a.registro_id,
        datos_anteriores: a.datos_anteriores,
        datos_nuevos: a.datos_nuevos,
        ip_address: a.ip_address,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async registrar(data: {
    id_usuario?: number;
    accion: string;
    tabla: string;
    registro_id: number;
    datos_anteriores?: unknown;
    datos_nuevos?: unknown;
    ip_address?: string;
  }) {
    try {
      await this.prisma.auditoria.create({
        data: {
          id_usuario: data.id_usuario ?? null,
          accion: data.accion,
          tabla: data.tabla,
          registro_id: data.registro_id,
          datos_anteriores: this.sanitizar(data.datos_anteriores) as Prisma.InputJsonValue,
          datos_nuevos: this.sanitizar(data.datos_nuevos) as Prisma.InputJsonValue,
          ip_address: data.ip_address ?? null,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error al registrar auditoría: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  async obtenerDatosAnteriores(
    tabla: string,
    registroId: number,
  ): Promise<Record<string, unknown> | null> {
    const mapping = TABLA_TO_TABLE[tabla];
    if (!mapping || !registroId) return null;

    const modelMap: Record<string, any> = {
      reservas: this.prisma.reservas,
      deportistas: this.prisma.deportistas,
      inscripciones: this.prisma.inscripciones,
      pagos: this.prisma.pagos,
      disciplinas: this.prisma.disciplinas,
      espacios: this.prisma.espacios,
      plantilla_horarios_fijos: this.prisma.plantilla_horarios_fijos,
    };

    const model = modelMap[mapping.table];
    if (!model) {
      this.logger.warn(`No hay modelo Prisma mapeado para ${mapping.table}`);
      return null;
    }

    try {
      const row = await model.findUnique({
        where: { [mapping.pk]: registroId },
      });
      return row ? (row as Record<string, unknown>) : null;
    } catch (error) {
      this.logger.warn(
        `No se pudieron obtener datos anteriores para ${tabla}#${registroId}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  private sanitizar(value: unknown): unknown {
    if (value === null || value === undefined) return undefined;
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizar(item));
    }
    if (typeof value === "object") {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
          result[key] = "***";
        } else {
          result[key] = this.sanitizar(val);
        }
      }
      return result;
    }
    return value;
  }
}
