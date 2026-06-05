import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CarrerasService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const data = await this.prisma.carreras.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" as const },
    });
    return data.map((c: any) => ({
      id: c.id_carrera,
      nombre: c.nombre,
      sigla: c.sigla,
    }));
  }
}
