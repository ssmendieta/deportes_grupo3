import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { CreateReservaDto } from "./dto/create-reserva.dto";
import { UpdateReservaDto } from "./dto/update-reserva.dto";
import { ComprobanteReservaBuilder } from "./pdf/comprobante-reserva.builder";
import { MAX_RESERVA_MINUTES } from "../common/constants/business.constants";
import { formatTime } from "../common/utils/response-mapper";

type ReservaConRelaciones = Prisma.reservasGetPayload<{
  include: { espacios: true; personas: true };
}>;

@Injectable()
export class ReservasService {
  private readonly logger = new Logger(ReservasService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async findAll(
    espacioId?: number,
    fecha?: string,
    page = 1,
    limit = 50,
  ) {
    const where: Record<string, unknown> = {};
    const skip = (page - 1) * limit;

    if (espacioId) where.id_espacio = espacioId;

    if (fecha) {
      const fechaDate = new Date(`${fecha}T00:00:00.000Z`);
      const fechaFin = new Date(`${fecha}T23:59:59.999Z`);
      where.fecha_reserva = { gte: fechaDate, lte: fechaFin };
    }

    const [data, total] = await Promise.all([
      this.prisma.reservas.findMany({
        where,
        skip,
        take: limit,
        include: {
          espacios: true,
          personas: true,
        },
        orderBy: { fecha_reserva: "asc" },
      }),
      this.prisma.reservas.count({ where }),
    ]);

    return {
      data: data.map((r: any) => this.mapReserva(r)),
      total,
      page: Number(page),
      limit: Number(limit),
    };
  }

  async findOne(id: number) {
    const reserva = await this.prisma.reservas.findUnique({
      where: { id_reserva: id },
      include: {
        espacios: true,
        personas: true,
      },
    });

    if (!reserva) {
      throw new NotFoundException(`Reserva con id ${id} no encontrada`);
    }

    return this.mapReserva(reserva);
  }

  private mapReserva(r: any) {
    return {
      id: r.id_reserva,
      id_reserva: r.id_reserva,
      espacio_id: r.id_espacio,
      id_espacio: r.id_espacio,
      id_persona_aprobador: r.id_persona_aprobador,
      fecha_reserva: r.fecha_reserva,
      hora_inicio: formatTime(r.hora_inicio),
      hora_fin: formatTime(r.hora_fin),
      tipo_reserva: r.tipo_reserva,
      motivo: r.motivo,
      estado: r.estado,
      ruta_comprobante_pdf: r.ruta_comprobante_pdf,
      nombre_solicitante: r.nombre_solicitante,
      ci: r.ci,
      complemento: r.complemento,
      correo_solicitante: r.correo_solicitante,
      espacio_nombre: r.espacios?.nombre_espacio ?? null,
      espacio: r.espacios
        ? {
            id: r.espacios.id_espacio,
            nombre: r.espacios.nombre_espacio,
            horario_apertura: formatTime(r.espacios.hora_apertura),
            horario_cierre: r.espacios.horario_cierre
              ? formatTime(r.espacios.horario_cierre)
              : null,
            activo: r.espacios.activo,
          }
        : null,
      aprobador_nombre: r.personas
        ? `${r.personas.nombres} ${r.personas.ape_paterno} ${r.personas.ape_materno ?? ""}`.trim()
        : null,
    };
  }

  private strToTime(hora: string): Date {
    return new Date(`1970-01-01T${hora}:00.000Z`);
  }

  private horaAMinutos(hora: string): number {
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m;
  }

  private timeToMinutos(dt: Date): number {
    if (!dt) return 0;
    return dt.getUTCHours() * 60 + dt.getUTCMinutes();
  }

  async create(dto: CreateReservaDto) {
    const durMin =
      this.horaAMinutos(dto.hora_fin) - this.horaAMinutos(dto.hora_inicio);
    if (durMin <= 0) {
      throw new BadRequestException(
        "La hora de fin debe ser mayor a la hora de inicio",
      );
    }
    if (durMin > MAX_RESERVA_MINUTES) {
      throw new BadRequestException(
        `La reserva no puede durar más de ${MAX_RESERVA_MINUTES / 60} horas`,
      );
    }

    const espacio = await this.prisma.espacios.findUnique({
      where: { id_espacio: dto.espacio_id },
    });
    if (!espacio) {
      throw new NotFoundException(
        `Espacio con id ${dto.espacio_id} no encontrado`,
      );
    }

    const hInicioMin = this.horaAMinutos(dto.hora_inicio);
    const hFinMin = this.horaAMinutos(dto.hora_fin);
    const aperturaMin = this.timeToMinutos(espacio.hora_apertura);
    const cierreMin = espacio.horario_cierre
      ? this.timeToMinutos(espacio.horario_cierre)
      : 1440;

    if (hInicioMin < aperturaMin || hFinMin > cierreMin) {
      throw new ConflictException(
        `El horario solicitado está fuera del horario del espacio (${
          formatTime(espacio.hora_apertura)
        } - ${
          espacio.horario_cierre ? formatTime(espacio.horario_cierre) : "24:00"
        })`,
      );
    }

    const fechaDate = new Date(`${dto.fecha_reserva}T12:00:00.000Z`);
    const diaSemana = fechaDate.getDay();

    const hInicioDate = this.strToTime(dto.hora_inicio);
    const hFinDate = this.strToTime(dto.hora_fin);

    const claseConflicto = await this.prisma.plantilla_horarios_fijos.findFirst({
      where: {
        id_espacio: dto.espacio_id,
        dia_semana: diaSemana,
        OR: [
          {
            hora_inicio: { lte: hInicioDate },
            hora_fin: { gt: hInicioDate },
          },
          {
            hora_inicio: { lt: hFinDate },
            hora_fin: { gte: hFinDate },
          },
          {
            hora_inicio: { gte: hInicioDate },
            hora_fin: { lte: hFinDate },
          },
        ],
      },
    });

    if (claseConflicto) {
      throw new ConflictException(
        `El horario (${dto.hora_inicio} - ${dto.hora_fin}) coincide con un horario de clases`,
      );
    }

    const fechaInicio = new Date(dto.fecha_reserva);
    fechaInicio.setUTCHours(0, 0, 0, 0);
    const fechaFin = new Date(dto.fecha_reserva);
    fechaFin.setUTCHours(23, 59, 59, 999);

    const nuevaReserva = await this.prisma.$transaction(async (tx: any) => {
      const reservaConflicto = await tx.reservas.findFirst({
        where: {
          id_espacio: dto.espacio_id,
          fecha_reserva: { gte: fechaInicio, lte: fechaFin },
          estado: "confirmada",
          OR: [
            {
              hora_inicio: { lte: hInicioDate },
              hora_fin: { gt: hInicioDate },
            },
            {
              hora_inicio: { lt: hFinDate },
              hora_fin: { gte: hFinDate },
            },
            {
              hora_inicio: { gte: hInicioDate },
              hora_fin: { lte: hFinDate },
            },
          ],
        },
      });

      if (reservaConflicto) {
        throw new ConflictException(
          `El horario (${dto.hora_inicio} - ${dto.hora_fin}) ya está reservado`,
        );
      }

      return tx.reservas.create({
        data: {
          id_espacio: dto.espacio_id,
          id_persona_aprobador: dto.id_persona_aprobador ?? null,
          fecha_reserva: fechaDate,
          hora_inicio: hInicioDate,
          hora_fin: hFinDate,
          tipo_reserva: dto.tipo_reserva,
          motivo: dto.motivo,
          estado: "Pendiente",
          nombre_solicitante: dto.nombre_solicitante,
          ci: dto.ci,
          complemento: dto.complemento ?? null,
          correo_solicitante: dto.correo_solicitante ?? "",
        },
        include: {
          espacios: true,
          personas: true,
        },
      });
    });

    this.logger.log(`Reserva creada: #${nuevaReserva.id_reserva}`);

    try {
      const pdfBuffer = await this.generarComprobante(nuevaReserva.id_reserva);
      await this.mailService.sendReservaConfirmada(
        nuevaReserva as unknown as ReservaConRelaciones,
        pdfBuffer,
      );
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "Error desconocido";
      this.logger.warn(
        `No se pudo enviar el correo de confirmación para reserva #${nuevaReserva.id_reserva}: ${mensaje}`,
      );
    }

    return this.mapReserva(nuevaReserva);
  }

  async update(id: number, dto: UpdateReservaDto) {
    const existing = await this.findOne(id);

    const hInicio = dto.hora_inicio ?? existing.hora_inicio;
    const hFin = dto.hora_fin ?? existing.hora_fin;
    const durMin = this.horaAMinutos(hFin) - this.horaAMinutos(hInicio);
    if (durMin <= 0) {
      throw new BadRequestException(
        "La hora de fin debe ser mayor a la hora de inicio",
      );
    }
    if (durMin > MAX_RESERVA_MINUTES) {
      throw new BadRequestException(
        `La reserva no puede durar más de ${MAX_RESERVA_MINUTES / 60} horas`,
      );
    }

    return this.prisma.$transaction(async (tx: any) => {
      const reserva = await tx.reservas.findUnique({
        where: { id_reserva: id },
      });

      if (!reserva) {
        throw new NotFoundException(`Reserva con id ${id} no encontrada`);
      }

      if (dto.estado !== undefined) {
        if (reserva.estado === "cancelada" && dto.estado === "cancelada") {
          throw new ConflictException(
            `La reserva #${id} ya se encuentra cancelada`,
          );
        }
        if (reserva.estado === "confirmada" && dto.estado === "confirmada") {
          return this.mapReserva(reserva);
        }
      }

      const updateData: Record<string, unknown> = {};
      if (dto.estado !== undefined) updateData.estado = dto.estado;
      if (dto.fecha_reserva !== undefined) {
        updateData.fecha_reserva = new Date(`${dto.fecha_reserva}T12:00:00.000Z`);
      }
      if (dto.hora_inicio !== undefined) {
        updateData.hora_inicio = this.strToTime(dto.hora_inicio);
      }
      if (dto.hora_fin !== undefined) {
        updateData.hora_fin = this.strToTime(dto.hora_fin);
      }
      if (dto.tipo_reserva !== undefined) updateData.tipo_reserva = dto.tipo_reserva;
      if (dto.nombre_solicitante !== undefined) updateData.nombre_solicitante = dto.nombre_solicitante;
      if (dto.ci !== undefined) updateData.ci = dto.ci;
      if (dto.complemento !== undefined) updateData.complemento = dto.complemento;
      if (dto.correo_solicitante !== undefined) updateData.correo_solicitante = dto.correo_solicitante;
      if (dto.motivo !== undefined) updateData.motivo = dto.motivo;
      if (dto.espacio_id !== undefined) updateData.id_espacio = dto.espacio_id;
      if (dto.id_persona_aprobador !== undefined) updateData.id_persona_aprobador = dto.id_persona_aprobador;

      const updated = await tx.reservas.update({
        where: { id_reserva: id },
        data: updateData,
        include: {
          espacios: true,
          personas: true,
        },
      });

      return this.mapReserva(updated);
    });
  }

  async generarComprobante(reservaId: number): Promise<Buffer> {
    const reserva = await this.findOne(reservaId);

    const builder = new ComprobanteReservaBuilder();

    builder.generarCabecera();
    builder.generarNumeracion(reserva.id_reserva);
    builder.generarContenido(reserva as any);
    builder.generarPiePagina();

    const doc = builder.getStream();

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));
      doc.end();
    });
  }
}
