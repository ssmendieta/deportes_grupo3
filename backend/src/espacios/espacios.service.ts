import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class EspaciosService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const data = await this.prisma.espacios.findMany({
      where: { activo: true },
    });
    return data.map((e: any) => ({
      id: e.id_espacio,
      nombre: e.nombre_espacio,
      horario_apertura: e.hora_apertura,
      horario_cierre: e.horario_cierre,
      activo: e.activo,
    }));
  }

  async findOne(id: number) {
    const e = await this.prisma.espacios.findUnique({
      where: { id_espacio: id },
    });
    if (!e) return null;
    return {
      id: e.id_espacio,
      nombre: e.nombre_espacio,
      horario_apertura: e.hora_apertura,
      horario_cierre: e.horario_cierre,
      activo: e.activo,
    };
  }
}
