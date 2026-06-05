import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
  constructor(private prisma: PrismaService) {}

  async findAll(query: AuditoriaQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.entidad) where.entidad = query.entidad;
    if (query.usuario) where.usuario_email = { contains: query.usuario, mode: 'insensitive' as const };
    if (query.desde || query.hasta) {
      where.fecha = {};
      if (query.desde) (where.fecha as any).gte = new Date(`${query.desde}T00:00:00.000Z`);
      if (query.hasta) (where.fecha as any).lte = new Date(`${query.hasta}T23:59:59.999Z`);
    }

    const [data, total] = await Promise.all([
      this.prisma.auditoria.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fecha: 'desc' },
      }),
      this.prisma.auditoria.count({ where }),
    ]);

    return {
      data: data.map((a) => ({
        id: a.id,
        fecha: a.fecha,
        usuario_email: a.usuario_email,
        usuario_rol: a.usuario_rol,
        accion: a.accion,
        entidad: a.entidad,
        entidad_id: a.entidad_id,
        detalle_antes: a.detalle_antes,
        detalle_despues: a.detalle_despues,
        ip: a.ip,
        correlation_id: a.correlation_id,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async registrar(data: {
    usuario_email: string;
    usuario_rol: string;
    accion: string;
    entidad: string;
    entidad_id: number;
    detalle_antes?: any;
    detalle_despues?: any;
    ip?: string;
    correlation_id?: string;
  }) {
    try {
      await (this.prisma.auditoria as any).create({ data });
    } catch {
      // No bloquear el flujo si falla la auditoría
    }
  }
}
