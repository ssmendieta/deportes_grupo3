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
  include: { espacios: true; personas_aprobador: true; personas_solicitante: true };
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
    limit = 7,
    estado?: string,
    busqueda?: string,
  ) {
    page = Math.max(1, Number.isNaN(Number(page)) ? 1 : Number(page));
    limit = Math.min(200, Math.max(1, Number.isNaN(Number(limit)) ? 7 : Number(limit)));
    const where: Record<string, unknown> = {};
    const skip = (page - 1) * limit;

    if (espacioId !== undefined && !Number.isNaN(Number(espacioId))) {
      where.id_espacio = Number(espacioId);
    }

    if (estado) where.estado = estado;

    if (busqueda) {
      const ids = await this.prisma.$queryRaw<{ id_reserva: number }[]>`
        SELECT id_reserva FROM "reservas"
        WHERE unaccent(nombre_solicitante) ILIKE ${'%' + busqueda + '%'}
      `;
      where.id_reserva = ids.length > 0
        ? { in: ids.map((r) => r.id_reserva) }
        : -1;
    }

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
          personas_aprobador: true,
          personas_solicitante: true,
        },
        orderBy: { fecha_reserva: "desc" },
      }),
      this.prisma.reservas.count({ where }),
    ]);

    return {
      data: data.map((r) => this.mapReserva(r)),
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
        personas_aprobador: true,
        personas_solicitante: true,
      },
    });

    if (!reserva) {
      throw new NotFoundException(`Reserva con id ${id} no encontrada`);
    }

    return this.mapReserva(reserva);
  }

  private mapReserva(r: ReservaConRelaciones) {
    return {
      id: r.id_reserva,
      espacio_id: r.id_espacio,
      id_persona_aprobador: r.id_persona_aprobador,
      id_solicitante: r.id_solicitante,
      fecha_reserva: r.fecha_reserva,
      hora_inicio: formatTime(r.hora_inicio),
      hora_fin: formatTime(r.hora_fin),
      tipo_reserva: r.tipo_reserva,
      motivo: r.motivo,
      estado: r.estado,
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
      aprobador_nombre: r.personas_aprobador
        ? `${r.personas_aprobador.nombres} ${r.personas_aprobador.ape_paterno} ${r.personas_aprobador.ape_materno ?? ""}`.trim()
        : null,
      solicitante_nombre: r.personas_solicitante
        ? `${r.personas_solicitante.nombres} ${r.personas_solicitante.ape_paterno} ${r.personas_solicitante.ape_materno ?? ""}`.trim()
        : null,
    };
  }

  private dateToStr(d: Date): string {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
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

    const hoy = new Date();
    hoy.setUTCHours(0, 0, 0, 0);
    const fechaSolicitada = new Date(fechaDate);
    fechaSolicitada.setUTCHours(0, 0, 0, 0);
    if (fechaSolicitada < hoy) {
      throw new BadRequestException("No se pueden crear reservas en fechas pasadas");
    }

    let idSolicitanteResuelto: number | null = null;
    if (dto.correo_solicitante?.trim()) {
      const usuario = await this.prisma.usuarios.findFirst({
        where: { email: dto.correo_solicitante.trim() },
        select: { id_persona: true },
      });
      if (usuario) {
        idSolicitanteResuelto = usuario.id_persona;
        this.logger.log(`id_solicitante resuelto: ${idSolicitanteResuelto} desde email ${dto.correo_solicitante}`);
      } else {
        this.logger.warn(`No se encontró usuario con email ${dto.correo_solicitante}, id_solicitante quedará null`);
      }
    }

    const hInicioDate = this.strToTime(dto.hora_inicio);
    const hFinDate = this.strToTime(dto.hora_fin);

    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const nuevaReserva = await this.prisma.$transaction(
          async (tx: Prisma.TransactionClient) => {
            const diaSemana = fechaDate.getUTCDay();

            const claseConflicto = await tx.plantilla_horarios_fijos.findFirst({
              where: {
                id_espacio: dto.espacio_id,
                dia_semana: diaSemana,
                OR: [
                  { hora_inicio: { lte: hInicioDate }, hora_fin: { gt: hInicioDate } },
                  { hora_inicio: { lt: hFinDate }, hora_fin: { gte: hFinDate } },
                  { hora_inicio: { gte: hInicioDate }, hora_fin: { lte: hFinDate } },
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

            const reservaConflicto = await tx.reservas.findFirst({
              where: {
                id_espacio: dto.espacio_id,
                fecha_reserva: { gte: fechaInicio, lte: fechaFin },
                estado: "confirmada",
                OR: [
                  { hora_inicio: { lte: hInicioDate }, hora_fin: { gt: hInicioDate } },
                  { hora_inicio: { lt: hFinDate }, hora_fin: { gte: hFinDate } },
                  { hora_inicio: { gte: hInicioDate }, hora_fin: { lte: hFinDate } },
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
                id_solicitante: idSolicitanteResuelto,
                fecha_reserva: fechaDate,
                hora_inicio: hInicioDate,
                hora_fin: hFinDate,
                tipo_reserva: dto.tipo_reserva,
                motivo: dto.motivo,
                nombre_solicitante: dto.nombre_solicitante,
                ci: dto.ci,
                complemento: dto.complemento ?? null,
                correo_solicitante: dto.correo_solicitante ?? null,
              },
              include: { espacios: true, personas_aprobador: true, personas_solicitante: true },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

        this.logger.log(`Reserva creada: #${nuevaReserva.id_reserva}`);

        this.enviarComprobanteEnSegundoPlano(nuevaReserva);

        return this.mapReserva(nuevaReserva);
      } catch (err) {
        if (
          err instanceof ConflictException ||
          err instanceof BadRequestException ||
          err instanceof NotFoundException
        ) {
          throw err;
        }
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2034" &&
          attempt < MAX_RETRIES - 1
        ) {
          lastError = err;
          this.logger.warn(
            `Conflicto de serialización en reserva, reintento ${attempt + 1}/${MAX_RETRIES}`,
          );
          continue;
        }
        throw err;
      }
    }

    throw lastError ?? new Error("No se pudo crear la reserva después de varios intentos");
  }

  async update(id: number, dto: UpdateReservaDto) {
    return this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const reserva = await tx.reservas.findUnique({
          where: { id_reserva: id },
          include: { espacios: true, personas_aprobador: true, personas_solicitante: true },
        });

        if (!reserva) {
          throw new NotFoundException(`Reserva con id ${id} no encontrada`);
        }

        if (reserva.estado === "cancelada") {
          throw new ConflictException(
            `La reserva #${id} está cancelada y no puede modificarse`,
          );
        }

        const espacioId = dto.espacio_id ?? reserva.id_espacio;
        const fechaStr = dto.fecha_reserva ?? this.dateToStr(reserva.fecha_reserva);
        const hInicio = dto.hora_inicio ?? formatTime(reserva.hora_inicio);
        const hFin = dto.hora_fin ?? formatTime(reserva.hora_fin);

        const durMin = this.horaAMinutos(hFin) - this.horaAMinutos(hInicio);
        if (durMin <= 0) {
          throw new BadRequestException("La hora de fin debe ser mayor a la hora de inicio");
        }
        if (durMin > MAX_RESERVA_MINUTES) {
          throw new BadRequestException(
            `La reserva no puede durar más de ${MAX_RESERVA_MINUTES / 60} horas`,
          );
        }

        const CAMPOS_VALIDACION_COMPLETA = [
          'fecha_reserva', 'hora_inicio', 'hora_fin', 'espacio_id',
          'tipo_reserva', 'nombre_solicitante', 'ci', 'complemento',
          'correo_solicitante', 'motivo', 'id_persona_aprobador', 'id_solicitante',
        ] as const;
        const soloCambiaEstado =
          dto.estado !== undefined &&
          CAMPOS_VALIDACION_COMPLETA.every((k) => (dto as any)[k] === undefined);

        if (!soloCambiaEstado) {
          const fechaDate = new Date(`${fechaStr}T12:00:00.000Z`);

          const hoy = new Date();
          hoy.setUTCHours(0, 0, 0, 0);
          const fechaSolicitada = new Date(fechaDate);
          fechaSolicitada.setUTCHours(0, 0, 0, 0);
          if (fechaSolicitada < hoy) {
            throw new BadRequestException("No se pueden modificar reservas a fechas pasadas");
          }

          if (
            dto.espacio_id !== undefined ||
            dto.hora_inicio !== undefined ||
            dto.hora_fin !== undefined
          ) {
            const espacio = await tx.espacios.findUnique({ where: { id_espacio: espacioId } });
            if (!espacio) {
              throw new NotFoundException(`Espacio con id ${espacioId} no encontrado`);
            }

            const hInicioMin = this.horaAMinutos(hInicio);
            const hFinMin = this.horaAMinutos(hFin);
            const aperturaMin = this.timeToMinutos(espacio.hora_apertura);
            const cierreMin = espacio.horario_cierre
              ? this.timeToMinutos(espacio.horario_cierre)
              : 1440;

            if (hInicioMin < aperturaMin || hFinMin > cierreMin) {
              throw new ConflictException(
                `El horario solicitado está fuera del horario del espacio (${formatTime(espacio.hora_apertura)} - ${espacio.horario_cierre ? formatTime(espacio.horario_cierre) : "24:00"})`,
              );
            }
          }

          const diaSemana = fechaDate.getUTCDay();
          const hInicioDate = this.strToTime(hInicio);
          const hFinDate = this.strToTime(hFin);

          const claseConflicto = await tx.plantilla_horarios_fijos.findFirst({
            where: {
              id_espacio: espacioId,
              dia_semana: diaSemana,
              OR: [
                { hora_inicio: { lte: hInicioDate }, hora_fin: { gt: hInicioDate } },
                { hora_inicio: { lt: hFinDate }, hora_fin: { gte: hFinDate } },
                { hora_inicio: { gte: hInicioDate }, hora_fin: { lte: hFinDate } },
              ],
            },
          });

          if (claseConflicto) {
            throw new ConflictException(
              `El horario (${hInicio} - ${hFin}) coincide con un horario de clases`,
            );
          }

          const fechaInicio = new Date(fechaStr);
          fechaInicio.setUTCHours(0, 0, 0, 0);
          const fechaFin = new Date(fechaStr);
          fechaFin.setUTCHours(23, 59, 59, 999);

          const reservaConflicto = await tx.reservas.findFirst({
            where: {
              id_espacio: espacioId,
              id_reserva: { not: id },
              fecha_reserva: { gte: fechaInicio, lte: fechaFin },
              estado: "confirmada",
              OR: [
                { hora_inicio: { lte: hInicioDate }, hora_fin: { gt: hInicioDate } },
                { hora_inicio: { lt: hFinDate }, hora_fin: { gte: hFinDate } },
                { hora_inicio: { gte: hInicioDate }, hora_fin: { lte: hFinDate } },
              ],
            },
          });

          if (reservaConflicto) {
            throw new ConflictException(
              `El horario (${hInicio} - ${hFin}) ya está reservado`,
            );
          }
        }

        if (dto.estado !== undefined && dto.estado === reserva.estado) {
          return this.mapReserva(reserva);
        }

        const updateData: Record<string, unknown> = {};
        if (dto.estado !== undefined) updateData.estado = dto.estado;
        if (dto.fecha_reserva !== undefined) {
          updateData.fecha_reserva = new Date(`${dto.fecha_reserva}T12:00:00.000Z`);
        }
        if (dto.hora_inicio !== undefined) updateData.hora_inicio = this.strToTime(dto.hora_inicio);
        if (dto.hora_fin !== undefined) updateData.hora_fin = this.strToTime(dto.hora_fin);
        if (dto.tipo_reserva !== undefined) updateData.tipo_reserva = dto.tipo_reserva;
        if (dto.nombre_solicitante !== undefined) updateData.nombre_solicitante = dto.nombre_solicitante;
        if (dto.ci !== undefined) updateData.ci = dto.ci;
        if (dto.complemento !== undefined) updateData.complemento = dto.complemento;
        if (dto.correo_solicitante !== undefined) updateData.correo_solicitante = dto.correo_solicitante;
        if (dto.motivo !== undefined) updateData.motivo = dto.motivo;
        if (dto.espacio_id !== undefined) updateData.id_espacio = dto.espacio_id;
          if (dto.id_persona_aprobador !== undefined) updateData.id_persona_aprobador = dto.id_persona_aprobador;
          if (dto.id_solicitante !== undefined) updateData.id_solicitante = dto.id_solicitante;

        const updated = await tx.reservas.update({
          where: { id_reserva: id },
          data: updateData,
          include: { espacios: true, personas_aprobador: true, personas_solicitante: true },
        });

        return this.mapReserva(updated);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async getReservasForReport(opts: {
    desde?: string;
    hasta?: string;
    estado?: string;
  }): Promise<any[]> {
    const where: Record<string, unknown> = {};

    if (opts.desde || opts.hasta) {
      const filtroFecha: Record<string, Date> = {};
      if (opts.desde) filtroFecha.gte = new Date(`${opts.desde}T00:00:00.000Z`);
      if (opts.hasta) filtroFecha.lte = new Date(`${opts.hasta}T23:59:59.999Z`);
      where.fecha_reserva = filtroFecha;
    }

    if (opts.estado && opts.estado !== "todos" && opts.estado !== "activas") {
      where.estado = opts.estado;
    }

    const data = await this.prisma.reservas.findMany({
      where,
      include: { espacios: true },
      orderBy: { fecha_reserva: "asc" },
    });

    return data.map((r) => ({
      id_reserva: r.id_reserva,
      nombre_solicitante: r.nombre_solicitante || "N/A",
      espacio_nombre: r.espacios?.nombre_espacio ?? "Desconocido",
      fecha_reserva: r.fecha_reserva,
      hora_inicio: formatTime(r.hora_inicio),
      hora_fin: formatTime(r.hora_fin),
      motivo: r.motivo || "",
      estado: r.estado.toUpperCase(),
    }));
  }

  private enviarComprobanteEnSegundoPlano(reserva: ReservaConRelaciones): void {
    this.generarComprobante(reserva.id_reserva)
      .then((pdfBuffer) => this.mailService.sendReservaConfirmada(reserva, pdfBuffer))
      .catch((err) => {
        const mensaje = err instanceof Error ? err.message : "Error desconocido";
        this.logger.warn(
          `No se pudo enviar el correo de confirmación para reserva #${reserva.id_reserva}: ${mensaje}`,
        );
      });
  }

  async generarComprobante(reservaId: number): Promise<Buffer> {
    const reserva = await this.findOne(reservaId);

    const builder = new ComprobanteReservaBuilder();

    builder.generarCabecera();
    builder.generarNumeracion(reserva.id);
    builder.generarContenido(reserva);
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
