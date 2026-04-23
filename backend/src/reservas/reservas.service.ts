import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateReservaDto } from "./dto/create-reserva.dto";
import { UpdateReservaDto } from "./dto/update-reserva.dto";
const PDFDocument = require('pdfkit');

@Injectable()
export class ReservasService {
  constructor(private prisma: PrismaService) {}

  async findAll(espacioId?: number, fecha?: string) {
    const where: any = {};

    if (espacioId) where.espacio_id = espacioId;

    if (fecha) {
      const fechaInicio = new Date(fecha);
      fechaInicio.setUTCHours(0, 0, 0, 0);
      const fechaFin = new Date(fecha);
      fechaFin.setUTCHours(23, 59, 59, 999);
      where.fecha = { gte: fechaInicio, lte: fechaFin };
    }

    return this.prisma.reserva.findMany({
      where,
      include: {
        espacio: true,
        disciplina: true,
      },
      orderBy: { fecha: "asc" },
    });
  }

  async findOne(id: number) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { id },
      include: {
        espacio: true,
        disciplina: true,
      },
    });

    if (!reserva) {
      throw new NotFoundException(`Reserva con id ${id} no encontrada`);
    }

    return reserva;
  }

  async create(dto: CreateReservaDto) {
    const fechaDate = new Date(dto.fecha);
    fechaDate.setHours(0, 0, 0, 0);

    // 1. Verificar que el espacio existe
    const espacio = await this.prisma.espacio.findUnique({
      where: { id: dto.espacio_id },
    });

    if (!espacio) {
      throw new NotFoundException(
        `Espacio con id ${dto.espacio_id} no encontrado`,
      );
    }

    // 2. Verificar que la disciplina existe
    const disciplina = await this.prisma.disciplina.findUnique({
      where: { id: dto.disciplina_id },
    });

    if (!disciplina) {
      throw new NotFoundException(
        `Disciplina con id ${dto.disciplina_id} no encontrada`,
      );
    }

    // 3. Verificar que el horario está dentro del horario del espacio
    if (
      dto.hora_inicio < espacio.horario_apertura ||
      dto.hora_fin > espacio.horario_cierre
    ) {
      throw new ConflictException(
        `El horario solicitado está fuera del horario del espacio (${espacio.horario_apertura} - ${espacio.horario_cierre})`,
      );
    }

    // 4. Verificar conflicto con clases
    const diaSemana = fechaDate.getDay();
    const claseConflicto = await this.prisma.horarioDisponible.findFirst({
      where: {
        espacio_id: dto.espacio_id,
        dia_semana: diaSemana,
        disponible: false,
        OR: [
          {
            hora_inicio: { lte: dto.hora_inicio },
            hora_fin: { gt: dto.hora_inicio },
          },
          {
            hora_inicio: { lt: dto.hora_fin },
            hora_fin: { gte: dto.hora_fin },
          },
          {
            hora_inicio: { gte: dto.hora_inicio },
            hora_fin: { lte: dto.hora_fin },
          },
        ],
      },
    });

    if (claseConflicto) {
      throw new ConflictException(
        `El horario (${dto.hora_inicio} - ${dto.hora_fin}) coincide con un horario de clases`,
      );
    }

    // 5. Verificar conflicto con otras reservas
    const fechaInicio = new Date(dto.fecha);
    fechaInicio.setUTCHours(0, 0, 0, 0);
    const fechaFin = new Date(dto.fecha);
    fechaFin.setUTCHours(23, 59, 59, 999);

    const reservaConflicto = await this.prisma.reserva.findFirst({
      where: {
        espacio_id: dto.espacio_id,
        fecha: { gte: fechaInicio, lte: fechaFin },
        estado: "confirmada",
        OR: [
          {
            hora_inicio: { lte: dto.hora_inicio },
            hora_fin: { gt: dto.hora_inicio },
          },
          {
            hora_inicio: { lt: dto.hora_fin },
            hora_fin: { gte: dto.hora_fin },
          },
          {
            hora_inicio: { gte: dto.hora_inicio },
            hora_fin: { lte: dto.hora_fin },
          },
        ],
      },
    });

    if (reservaConflicto) {
      throw new ConflictException(
        `El horario (${dto.hora_inicio} - ${dto.hora_fin}) ya está reservado`,
      );
    }
  }

  async update(id: number, dto: UpdateReservaDto) {
    const reserva = await this.findOne(id);

    if (reserva.estado === "cancelada") {
      throw new ConflictException(
        "No se puede modificar una reserva que ya está cancelada",
      );
    }

    return this.prisma.reserva.update({
      where: { id },
      data: { estado: dto.estado },
      include: {
        espacio: true,
        disciplina: true,
      },
    });
  }

  // PARA EL PDF
  async generarComprobante(reservaId: number): Promise<Buffer> {
    const reserva = await this.findOne(reservaId);

    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer<ArrayBufferLike>) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Diseño del Comprobante UCB
      doc.fillColor('#003366').fontSize(20).text('UNIVERSIDAD CATÓLICA BOLIVIANA', { align: 'center' });
      doc.fontSize(12).text('SISTEMA DE GESTIÓN DEPORTIVA', { align: 'center' });
      doc.moveDown();
      doc.rect(50, doc.y, 500, 2).fill('#003366');
      doc.moveDown(2);

      doc.fillColor('black').font('Helvetica-Bold').fontSize(14).text('COMPROBANTE DE RESERVA', { align: 'center' });
      doc.moveDown();

      doc.font('Helvetica').fontSize(11);
      doc.text(`Nro. Reserva: ${reserva.id}`);
      doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-BO')}`);
      doc.moveDown();

      doc.font('Helvetica-Bold').text('DATOS DEL SOLICITANTE:');
      doc.font('Helvetica').text(`Nombre: ${reserva.nombre_solicitante}`);
      doc.text(`C.I.: ${reserva.carnet}`);
      doc.moveDown();

      doc.font('Helvetica-Bold').text('DETALLES DEL ESPACIO:');
      doc.font('Helvetica').text(`Espacio: ${reserva.espacio.nombre}`);
      doc.text(`Ubicación: ${reserva.espacio.ubicacion}`);
      doc.text(`Disciplina: ${reserva.disciplina.nombre}`);
      doc.text(`Fecha Reserva: ${reserva.fecha.toLocaleDateString('es-BO')}`);
      doc.text(`Horario: ${reserva.hora_inicio} - ${reserva.hora_fin}`);
      doc.moveDown();

      doc.font('Helvetica-Bold').text('MOTIVO:');
      doc.font('Helvetica').text(`${reserva.motivo}`);

      doc.moveDown(4);
      doc.fontSize(9).text('Este documento sirve como respaldo oficial. Favor presentarse 10 minutos antes.', { align: 'center', italic: true });

      doc.end();
    });
  }
}