import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DisciplinasService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.disciplina.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    });
  }
}
