import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { formatTime } from "../common/utils/response-mapper";

const CACHE_TTL_MS = 5 * 60 * 1000;
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class EspaciosService {
  private cacheEspacios: CacheEntry<any[]> | null = null;
  private cacheRango: CacheEntry<any> | null = null;

  constructor(private prisma: PrismaService) {}

  async findAll() {
    if (this.cacheEspacios && Date.now() < this.cacheEspacios.expiresAt) {
      return this.cacheEspacios.data;
    }

    const data = await this.prisma.espacios.findMany({
      where: { activo: true },
    });
    const result = data.map((e: any) => ({
      id: e.id_espacio,
      nombre: e.nombre_espacio,
      horario_apertura: formatTime(e.hora_apertura),
      horario_cierre: formatTime(e.horario_cierre),
      activo: e.activo,
    }));

    this.cacheEspacios = { data: result, expiresAt: Date.now() + CACHE_TTL_MS };
    return result;
  }

  async findOne(id: number) {
    const e = await this.prisma.espacios.findUnique({
      where: { id_espacio: id },
    });
    if (!e) return null;
    return {
      id: e.id_espacio,
      nombre: e.nombre_espacio,
      horario_apertura: formatTime(e.hora_apertura),
      horario_cierre: formatTime(e.horario_cierre),
      activo: e.activo,
    };
  }

  async getRangoHorario() {
    const espacios = await this.prisma.espacios.findMany({
      where: { activo: true },
      select: {
        hora_apertura: true,
        horario_cierre: true,
      },
    });

    let min = 1440;
    let max = 0;

    for (const e of espacios) {
      const apertura = e.hora_apertura
        ? e.hora_apertura.getUTCHours() * 60 + e.hora_apertura.getUTCMinutes()
        : 0;
      const cierre = e.horario_cierre
        ? e.horario_cierre.getUTCHours() * 60 + e.horario_cierre.getUTCMinutes()
        : 1440;
      if (apertura < min) min = apertura;
      if (cierre > max) max = cierre;
    }

    const fmt = (m: number) =>
      `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

    return { min: fmt(min), max: fmt(max) };
  }
}
