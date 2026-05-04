import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeportistaDto } from './dto/create-deportista.dto';

@Injectable()
export class DeportistasService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, tipo?: string, disciplinaId?: string, activo?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (tipo) where.tipo = tipo;
    if (activo === 'true') where.activo = true;
    if (disciplinaId) {
      where.inscripciones = { some: { disciplina_id: parseInt(disciplinaId), estado: 'activo' } };
    }

    const [data, total] = await Promise.all([
      this.prisma.deportista.findMany({
        where, skip, take: Number(limit),
        include: { inscripciones: { include: { disciplina: true } } }
      }),
      this.prisma.deportista.count({ where })
    ]);

    return { data, total, page: Number(page), limit: Number(limit) };
  }

  async findOne(id: number) {
    const deportista = await this.prisma.deportista.findUnique({
      where: { id },
      include: { 
        inscripciones: { where: { estado: 'activo' }, include: { disciplina: true } } 
      }
    });
    if (!deportista) throw new NotFoundException(`Deportista #${id} no encontrado`);
    return deportista;
  }

  async buscarPorCi(ci: string) {
    const deportista = await this.prisma.deportista.findUnique({ where: { ci } });
    if (!deportista) throw new NotFoundException(`Deportista con CI ${ci} no encontrado`);
    return deportista;
  }

  async create(dto: CreateDeportistaDto) {
    const existe = await this.prisma.deportista.findUnique({ where: { ci: dto.ci } });
    if (existe) throw new ConflictException(`El CI ${dto.ci} ya está registrado`);

    // Transacción: Si falla la inscripción, no se crea el deportista a medias
    return this.prisma.$transaction(async (prisma) => {
      const nuevoDeportista = await prisma.deportista.create({
        data: {
          tipo: dto.tipo,
          ci: dto.ci,
          nombre_completo: dto.nombre_completo,
          carrera: dto.carrera,
          semestre: dto.semestre,
          fecha_nacimiento: dto.fecha_nacimiento ? new Date(dto.fecha_nacimiento) : null,
          genero: dto.genero,
          telefono: dto.telefono,
          email: dto.email,
        }
      });

      if (dto.disciplinaId) {
        await prisma.inscripcion.create({
          data: {
            deportista_id: nuevoDeportista.id,
            disciplina_id: dto.disciplinaId,
            categoria: dto.categoria,
            nivel: dto.nivel,
          }
        });
      }
      return nuevoDeportista;
    });
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    const { ci, tipo, ...updateData } = dto; // Ignoramos ci y tipo por seguridad
    return this.prisma.deportista.update({ where: { id }, data: updateData });
  }

  async cambiarEstado(id: number, activo: boolean) {
    await this.findOne(id);
    return this.prisma.deportista.update({ where: { id }, data: { activo } });
  }

  async inscribir(deportistaId: number, body: { disciplinaId: number, categoria?: string, nivel?: string }) {
    await this.findOne(deportistaId); 
    
    // Verificamos que la disciplina exista para lanzar el 404 correcto
    const disciplina = await this.prisma.disciplina.findUnique({
      where: { id: body.disciplinaId }
    });
    if (!disciplina) {
      throw new NotFoundException(`La disciplina #${body.disciplinaId} no existe`);
    }

    const existeInscripcion = await this.prisma.inscripcion.findFirst({
      where: {
        deportista_id: deportistaId,
        disciplina_id: body.disciplinaId,
        categoria: body.categoria,
        estado: 'activo'
      }
    });

    if (existeInscripcion) {
      throw new ConflictException('El deportista ya está inscrito activamente en esta disciplina/categoría');
    }

    return this.prisma.inscripcion.create({
      data: {
        deportista_id: deportistaId,
        disciplina_id: body.disciplinaId,
        categoria: body.categoria,
        nivel: body.nivel
      }
    });
  }

  async obtenerInscripciones(deportistaId: number) {
    return this.prisma.inscripcion.findMany({
      where: { deportista_id: deportistaId },
      include: { disciplina: true }
    });
  }
}