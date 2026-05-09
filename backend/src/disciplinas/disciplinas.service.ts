import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDisciplinaDto } from "./dto/create-disciplina.dto";

@Injectable()
export class DisciplinasService {
  constructor(private prisma: PrismaService) {}

  async findAll(activo?: string) {
    const where = activo === "true" ? { activo: true } : {};
    return this.prisma.disciplina.findMany({
      where,
      orderBy: { orden: "asc" },
    });
  }

  async findOne(id: number) {
    const disciplina = await this.prisma.disciplina.findUnique({
      where: { id },
    });
    if (!disciplina)
      throw new NotFoundException(`Disciplina #${id} no encontrada`);
    return disciplina;
  }

  async create(dto: CreateDisciplinaDto) {
    const existe = await this.prisma.disciplina.findUnique({
      where: { nombre: dto.nombre },
    });
    if (existe)
      throw new ConflictException(`La disciplina ${dto.nombre} ya existe`);

    return this.prisma.disciplina.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        categorias: dto.categorias,
        mensualidad: dto.mensualidad,
        orden: dto.orden,
        activo: true,
      },
    });
  }

  async update(id: number, dto: any) {
    await this.findOne(id);

    const dataLimpia: any = {};
    if (dto.descripcion !== undefined) dataLimpia.descripcion = dto.descripcion;
    if (dto.categorias !== undefined) dataLimpia.categorias = dto.categorias;
    if (dto.mensualidad !== undefined) dataLimpia.mensualidad = dto.mensualidad;
    if (dto.activo !== undefined) dataLimpia.activo = dto.activo;
    if (dto.orden !== undefined) dataLimpia.orden = dto.orden;

    return this.prisma.disciplina.update({ where: { id }, data: dataLimpia });
  }

  async cambiarEstado(id: number, activo: boolean) {
    await this.findOne(id);
    return this.prisma.disciplina.update({ where: { id }, data: { activo } });
  }
}
