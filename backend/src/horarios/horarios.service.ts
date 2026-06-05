import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class HorariosService {
  constructor(private prisma: PrismaService) {}

  private formatTime(dt: Date): string {
    if (!dt) return "";
    const h = dt.getUTCHours().toString().padStart(2, "0");
    const m = dt.getUTCMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  }

  async getDisponibilidad(espacioId: number, fecha: string) {
    const espacio: any = await this.prisma.espacios.findUnique({
      where: { id_espacio: espacioId },
      select: {
        nombre_espacio: true,
        hora_apertura: true,
        horario_cierre: true,
      },
    });

    if (!espacio) {
      throw new NotFoundException(`Espacio con id ${espacioId} no encontrado`);
    }

    const fechaDate = new Date(`${fecha}T12:00:00.000Z`);
    const diaSemana = fechaDate.getUTCDay();

    const clases: any[] = await (this.prisma
      .plantilla_horarios_fijos as any).findMany({
      where: {
        id_espacio: espacioId,
        dia_semana: diaSemana,
      },
      include: {
        tipos_bloqueo: true,
      },
    });

    const fechaInicio = new Date(fecha);
    fechaInicio.setUTCHours(0, 0, 0, 0);
    const fechaFin = new Date(fecha);
    fechaFin.setUTCHours(23, 59, 59, 999);

    const reservas: any[] = await this.prisma.reservas.findMany({
      where: {
        id_espacio: espacioId,
        fecha_reserva: { gte: fechaInicio, lte: fechaFin },
        estado: { in: ["Pendiente", "confirmada"] },
      },
      select: {
        hora_inicio: true,
        hora_fin: true,
        estado: true,
        motivo: true,
      },
    });

    return {
      espacio: {
        nombre: espacio.nombre_espacio,
        horario_apertura: this.formatTime(espacio.hora_apertura),
        horario_cierre: espacio.horario_cierre
          ? this.formatTime(espacio.horario_cierre)
          : null,
      },
      bloques_ocupados: [
        ...clases.map((c: any) => ({
          hora_inicio: this.formatTime(c.hora_inicio),
          hora_fin: this.formatTime(c.hora_fin),
          tipo: c.tipos_bloqueo?.nombre_bloqueo ?? "clase",
          motivo: c.tipos_bloqueo?.nombre_bloqueo ?? "Horario de clases",
        })),
        ...reservas.map((r: any) => ({
          hora_inicio: this.formatTime(r.hora_inicio),
          hora_fin: this.formatTime(r.hora_fin),
          tipo: "reserva",
          estado: r.estado,
          motivo: r.motivo,
        })),
      ],
    };
  }
}
