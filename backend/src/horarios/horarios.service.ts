import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class HorariosService {
  constructor(private prisma: PrismaService) {}

  async getDisponibilidad(espacioId: number, fecha: string) {
    const espacio = await this.prisma.espacio.findUnique({
      where: { id: espacioId },
      select: {
        nombre: true,
        horario_apertura: true,
        horario_cierre: true,
      },
    });

    if (!espacio) {
      throw new NotFoundException(`Espacio con id ${espacioId} no encontrado`);
    }

    // Bloques bloqueados por clases (plantilla semanal)
    const fechaDate = new Date(`${fecha}T12:00:00.000Z`);
    const diaSemana = fechaDate.getUTCDay(); // 0=domingo, 6=sábado

    const clases = await this.prisma.horarioDisponible.findMany({
      where: {
        espacio_id: espacioId,
        dia_semana: diaSemana,
        disponible: false, // false = bloqueado por clase
      },
      select: {
        hora_inicio: true,
        hora_fin: true,
      },
    });

    // Bloques ocupados por reservas ese día
    const fechaInicio = new Date(fecha);
    fechaInicio.setUTCHours(0, 0, 0, 0);
    const fechaFin = new Date(fecha);
    fechaFin.setUTCHours(23, 59, 59, 999);

    const reservas = await this.prisma.reserva.findMany({
      where: {
        espacio_id: espacioId,
        fecha: { gte: fechaInicio, lte: fechaFin },
        estado: { in: ["pendiente", "confirmada"] },
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
        nombre: espacio.nombre,
        horario_apertura: espacio.horario_apertura,
        horario_cierre: espacio.horario_cierre,
      },
      bloques_ocupados: [
        ...clases.map((c) => ({
          hora_inicio: c.hora_inicio,
          hora_fin: c.hora_fin,
          tipo: "clase",
          motivo: "Horario de clases",
        })),
        ...reservas.map((r) => ({
          hora_inicio: r.hora_inicio,
          hora_fin: r.hora_fin,
          tipo: "reserva",
          estado: r.estado,
          motivo: r.motivo,
        })),
      ],
    };
  }
}
