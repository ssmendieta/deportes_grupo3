import PDFDocument from 'pdfkit';
import * as path from 'path';
import { formatFechaBO } from '../../common/utils/response-mapper';

export class ComprobanteReservaBuilder {
  private doc: PDFKit.PDFDocument;

  constructor() {
    this.doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
  }

  generarCabecera() {
    const logoPath = path.join(__dirname, '..', '..', '..', 'assets', 'logo-ucb.png');

    try {
      this.doc.image(logoPath, 50, 45, { width: 80 });
    } catch (e) {
      console.warn("No se pudo cargar el logo en el PDF");
    }

    this.doc
      .fillColor('#003366')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('UNIVERSIDAD CATÓLICA BOLIVIANA', 140, 50, { align: 'right' })
      .fontSize(10)
      .text('SISTEMA DE GESTIÓN DEPORTIVA', 140, 70, { align: 'right' })
      .moveDown();

    this.doc.rect(50, 135, 500, 2).fill('#003366');
  }

  generarNumeracion(id: number) {
    const anio = new Date().getFullYear();
    const idFormateado = id.toString().padStart(6, '0');
    const correlativo = `RES-${anio}-${idFormateado}`;

    this.doc
      .fillColor('#444444')
      .fontSize(10)
      .font('Helvetica')
      .text(`NRO. CONTROL: ${correlativo}`, 50, 145, { align: 'right' });

    this.doc
      .fillColor('black')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('COMPROBANTE DE RESERVA', 50, 170, { align: 'center' })
      .moveDown();
  }

  generarContenido(reserva: any) {
    this.doc.font('Helvetica').fontSize(11);

    this.doc.font('Helvetica-Bold').text('DATOS DEL SOLICITANTE:');
    this.doc.font('Helvetica')
      .text(`Nombre: ${reserva.nombre_solicitante}`)
      .text(`C.I.: ${reserva.ci}${reserva.complemento ? ' ' + reserva.complemento : ''}`)
      .moveDown();

    this.doc.font('Helvetica-Bold').text('DETALLES DE LA RESERVA:');
    this.doc.font('Helvetica')
      .text(`Espacio: ${reserva.espacio_nombre}`)
      .text(`Tipo: ${reserva.tipo_reserva}`)
      .text(`Estado: ${reserva.estado}`)
      .text(`Fecha: ${formatFechaBO(reserva.fecha_reserva)}`)
      .text(`Horario: ${reserva.hora_inicio} - ${reserva.hora_fin}`)
      .moveDown();

    if (reserva.aprobador_nombre) {
      this.doc.font('Helvetica-Bold').text('APROBADO POR:');
      this.doc.font('Helvetica').text(`${reserva.aprobador_nombre}`).moveDown();
    }

    this.doc.font('Helvetica-Bold').text('NOTA:');
    this.doc.font('Helvetica').text('Favor presentarse 10 minutos antes del horario reservado con su carnet de identidad.');
  }

  generarPiePagina() {
    const fechaEmision = formatFechaBO(new Date());
    const range = this.doc.bufferedPageRange();

    for (let i = range.start; i < range.start + range.count; i++) {
      this.doc.switchToPage(i);

      this.doc
        .fontSize(8)
        .fillColor('#888888')
        .text('__________________________________________________________________________', 50, 740, { align: 'center' })
        .text(`Fecha de emisión: ${fechaEmision} | Sede La Paz`, 50, 755, { align: 'center' })
        .text('Dirección: Av. 14 de Septiembre nro. 4807, Obrajes', 50, 765, { align: 'center' })
        .font('Helvetica-Bold')
        .text('Este documento es un comprobante oficial de reserva del Departamento de Deportes U.C.B.', 50, 775, { align: 'center' });
    }
  }

  getStream(): PDFKit.PDFDocument {
    return this.doc;
  }
}
