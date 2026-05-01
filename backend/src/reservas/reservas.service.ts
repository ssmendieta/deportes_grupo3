import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateReservaDto } from "./dto/create-reserva.dto";
import { UpdateReservaDto } from "./dto/update-reserva.dto";
const PDFDocument = require("pdfkit");

@Injectable()
export class ReservasService {
  constructor(private prisma: PrismaService) {}

  async findAll(espacioId?: number, fecha?: string) {
    const where: any = {};

    if (espacioId) where.espacio_id = espacioId;

    // En findAll() — cambiar las dos líneas de fechaInicio y fechaFin
    if (fecha) {
      const fechaInicio = new Date(`${fecha}T00:00:00.000Z`);
      const fechaFin = new Date(`${fecha}T23:59:59.999Z`);
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
    const fechaDate = new Date(`${dto.fecha}T12:00:00.000Z`);

    const espacio = await this.prisma.espacio.findUnique({
      where: { id: dto.espacio_id },
    });

    if (!espacio) {
      throw new NotFoundException(
        `Espacio con id ${dto.espacio_id} no encontrado`,
      );
    }

    const disciplina = await this.prisma.disciplina.findUnique({
      where: { id: dto.disciplina_id },
    });
    console.log("Disciplina encontrada:", disciplina);

    if (!disciplina) {
      throw new NotFoundException(
        `Disciplina con id ${dto.disciplina_id} no encontrada`,
      );
    }

    if (
      dto.hora_inicio < espacio.horario_apertura ||
      dto.hora_fin > espacio.horario_cierre
    ) {
      throw new ConflictException(
        `El horario solicitado está fuera del horario del espacio (${espacio.horario_apertura} - ${espacio.horario_cierre})`,
      );
    }

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

    const nuevaReserva = await this.prisma.reserva.create({
      data: {
        espacio_id: dto.espacio_id,
        solicitante_id: 0,
        deportista_id: 0,
        fecha: fechaDate,
        hora_inicio: dto.hora_inicio,
        hora_fin: dto.hora_fin,
        disciplina_id: dto.disciplina_id,
        motivo: dto.motivo,
        estado: "confirmada",
        nombre_solicitante: dto.nombre_solicitante,
        carnet: dto.carnet,
      },
      include: {
        espacio: true,
        disciplina: true,
      },
    });

    console.log("Reserva creada:", nuevaReserva.id);
    return nuevaReserva;
  }

  async update(id: number, dto: UpdateReservaDto) {
    const reserva = await this.findOne(id);

    return this.prisma.reserva.update({
      where: { id },
      data: {
        ...(dto.estado !== undefined && { estado: dto.estado }),
        // En update() — cambiar new Date(dto.fecha) por esto
        ...(dto.fecha !== undefined && {
          fecha: new Date(`${dto.fecha}T12:00:00.000Z`),
        }),
        ...(dto.hora_inicio !== undefined && { hora_inicio: dto.hora_inicio }),
        ...(dto.hora_fin !== undefined && { hora_fin: dto.hora_fin }),
        ...(dto.nombre_solicitante !== undefined && {
          nombre_solicitante: dto.nombre_solicitante,
        }),
        ...(dto.carnet !== undefined && { carnet: dto.carnet }),
        ...(dto.motivo !== undefined && { motivo: dto.motivo }),
        ...(dto.disciplina_id !== undefined && {
          disciplina: { connect: { id: dto.disciplina_id } },
        }),
        ...(dto.espacio_id !== undefined && {
          espacio: { connect: { id: dto.espacio_id } },
        }),
      },
      include: {
        espacio: true,
        disciplina: true,
      },
    });
  }
  async generarComprobante(reservaId: number): Promise<Buffer> {
    const reserva = await this.findOne(reservaId);

    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer<ArrayBufferLike>) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc
        .fillColor("#003366")
        .fontSize(20)
        .text("UNIVERSIDAD CATÓLICA BOLIVIANA", { align: "center" });
      doc
        .fontSize(12)
        .text("SISTEMA DE GESTIÓN DEPORTIVA", { align: "center" });
      doc.moveDown();
      doc.rect(50, doc.y, 500, 2).fill("#003366");
      doc.moveDown(2);

      doc
        .fillColor("black")
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("COMPROBANTE DE RESERVA", { align: "center" });
      doc.moveDown();

      doc.font("Helvetica").fontSize(11);
      doc.text(`Nro. Reserva: ${reserva.id}`);
      doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString("es-BO")}`);
      doc.moveDown();

      doc.font("Helvetica-Bold").text("DATOS DEL SOLICITANTE:");
      doc.font("Helvetica").text(`Nombre: ${reserva.nombre_solicitante}`);
      doc.text(`C.I.: ${reserva.carnet}`);
      doc.moveDown();

      doc.font("Helvetica-Bold").text("DETALLES DEL ESPACIO:");
      doc.font("Helvetica").text(`Espacio: ${reserva.espacio.nombre}`);
      doc.text(`Ubicación: ${reserva.espacio.ubicacion}`);
      doc.text(`Disciplina: ${reserva.disciplina.nombre}`);
      doc.text(`Fecha Reserva: ${reserva.fecha.toLocaleDateString("es-BO")}`);
      doc.text(`Horario: ${reserva.hora_inicio} - ${reserva.hora_fin}`);
      doc.moveDown();

      doc.font("Helvetica-Bold").text("MOTIVO:");
      doc.font("Helvetica").text(`${reserva.motivo}`);

      doc.moveDown(4);
      doc
        .fontSize(9)
        .text(
          "Este documento sirve como respaldo oficial. Favor presentarse 10 minutos antes.",
          { align: "center", italic: true },
        );

      doc.end();
    });
  }
}
