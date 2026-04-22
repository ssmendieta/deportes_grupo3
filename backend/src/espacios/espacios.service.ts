import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class EspaciosService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.espacio.findMany({
      where: { activo: true },
    });
  }

  findOne(id: number) {
    return this.prisma.espacio.findUnique({
      where: { id },
    });
  }
}
