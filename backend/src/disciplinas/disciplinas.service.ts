import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDisciplinaDto } from "./dto/create-disciplina.dto";
import { UpdateDisciplinaDto } from "./dto/update-disciplina.dto";

@Injectable()
export class DisciplinasService {
  constructor(private prisma: PrismaService) {}

  private map(d: any) {
    if (!d) return null;
    return {
      id: d.id_disciplina,
      nombre: d.nombre_disciplina,
      activo: d.activo,
    };
  }

  async findAll(activo?: string) {
    const where: any = activo === "true" ? { activo: true } : {};
    const data = await this.prisma.disciplinas.findMany({
      where,
      orderBy: { nombre_disciplina: "asc" },
    });
    return data.map((d: any) => this.map(d));
  }

  async findOne(id: number) {
    const d = await this.prisma.disciplinas.findUnique({
      where: { id_disciplina: id },
    });
    if (!d) throw new NotFoundException(`Disciplina #${id} no encontrada`);
    return this.map(d);
  }

  async create(dto: CreateDisciplinaDto) {
    const existe = await this.prisma.disciplinas.findFirst({
      where: { nombre_disciplina: dto.nombre_disciplina },
    });
    if (existe)
      throw new ConflictException(
        `La disciplina ${dto.nombre_disciplina} ya existe`,
      );

    const created = await this.prisma.disciplinas.create({
      data: {
        nombre_disciplina: dto.nombre_disciplina,
        activo: true,
      },
    });
    return this.map(created);
  }

  async update(id: number, dto: UpdateDisciplinaDto) {
    await this.findOne(id);

    const data: any = {};
    if (dto.nombre_disciplina !== undefined)
      data.nombre_disciplina = dto.nombre_disciplina;

    const updated = await this.prisma.disciplinas.update({
      where: { id_disciplina: id },
      data,
    });
    return this.map(updated);
  }

  async cambiarEstado(id: number, activo: boolean) {
    await this.findOne(id);
    const updated = await this.prisma.disciplinas.update({
      where: { id_disciplina: id },
      data: { activo },
    });
    return this.map(updated);
  }
}
