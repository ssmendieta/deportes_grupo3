import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { mailConfig } from '../config/mail.config';
import { Prisma } from '@prisma/client';

type ReservaConRelaciones = Prisma.reservasGetPayload<{
  include: { espacios: true };
}>;

function formatHora(dt: Date): string {
  if (!dt) return '';
  const h = dt.getUTCHours().toString().padStart(2, '0');
  const m = dt.getUTCMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private transporter = nodemailer.createTransport({
    host: mailConfig.host,
    port: mailConfig.port,
    secure: mailConfig.port === 465,
    auth: {
      user: mailConfig.user,
      pass: mailConfig.pass,
    },
  });

  private compiledTemplate: handlebars.TemplateDelegate | null = null;

  private getTemplate(): handlebars.TemplateDelegate {
    if (!this.compiledTemplate) {
      const tplPath = path.join(process.cwd(), 'src', 'mail', 'templates', 'reserva-confirmada.hbs');
      const source = fs.readFileSync(tplPath, 'utf8');
      this.compiledTemplate = handlebars.compile(source);
    }
    return this.compiledTemplate;
  }

  async sendReservaConfirmada(reserva: ReservaConRelaciones, pdfBuffer: Buffer): Promise<void> {
    if (!reserva.correo_solicitante) {
      this.logger.warn(`Reserva #${reserva.id_reserva} sin correo_solicitante, no se envió correo`);
      return;
    }

    const fecha = new Date(reserva.fecha_reserva).toLocaleDateString('es-BO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const ciStr = reserva.complemento
      ? `${reserva.ci} ${reserva.complemento}`
      : `${reserva.ci}`;

    const html = this.getTemplate()({
      id: reserva.id_reserva,
      nombre_solicitante: reserva.nombre_solicitante,
      carnet: ciStr,
      espacio_nombre: reserva.espacios?.nombre_espacio ?? '',
      fecha,
      hora_inicio: formatHora(reserva.hora_inicio),
      hora_fin: formatHora(reserva.hora_fin),
      motivo: reserva.motivo,
      estado: reserva.estado,
    });

    const logoPath = path.join(process.cwd(), '..', 'frontend', 'src', 'assets', 'logo ucb.png');

    await this.transporter.sendMail({
      from: `"Sistema de Reservas UCB" <${mailConfig.from}>`,
      to: reserva.correo_solicitante,
      subject: `Confirmación de reserva #${reserva.id_reserva} — UCB`,
      html,
      attachments: [
        {
          filename: `comprobante-reserva-${reserva.id_reserva}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
        {
          filename: 'logo-ucb.png',
          path: logoPath,
          cid: 'ucb-logo',
        },
      ],
    });

    this.logger.log(`Correo enviado a ${reserva.correo_solicitante} (reserva #${reserva.id_reserva})`);
  }
}
