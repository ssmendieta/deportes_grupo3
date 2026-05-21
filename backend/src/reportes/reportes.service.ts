import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

@Injectable()
export class ReportesService {
  
  // Generar Excel genérico
  async generarExcel(titulo: string, columnas: { header: string, key: string }[], filas: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(titulo);

    worksheet.columns = columnas.map(col => ({ ...col, width: 20 }));
    worksheet.addRows(filas);

    // Estilo al encabezado (Azul UCB)
    worksheet.getRow(1).eachCell((cell: ExcelJS.Cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // Generar PDF con Tabla genérica
  async generarPdfTabla(titulo: string, columnas: { header: string, key: string }[], filas: any[]): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 30 });
    const chunks: Buffer[] = [];

    return new Promise((resolve) => {
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Título del Reporte
      doc.fillColor('#003366').fontSize(16).text(titulo, { align: 'center' });
      doc.moveDown();

      // Dibujar Encabezado de Tabla
      let currentY = doc.y;
      const startX = 30;
      const colWidth = 530 / columnas.length;

      doc.rect(startX, currentY, 530, 20).fill('#003366');
      doc.fillColor('white').fontSize(10);
      
      columnas.forEach((col, i) => {
        doc.text(col.header, startX + (i * colWidth), currentY + 5, { width: colWidth, align: 'center' });
      });

      // Dibujar Filas
      doc.fillColor('black');
      currentY += 20;

      filas.forEach((fila) => {
        columnas.forEach((col, i) => {
          const texto = String(fila[col.key] || '');
          doc.text(texto, startX + (i * colWidth), currentY + 5, { width: colWidth, align: 'center' });
        });
        currentY += 20;
        
        // Línea divisoria
        doc.moveTo(startX, currentY).lineTo(startX + 530, currentY).strokeColor('#eeeeee').stroke();
      });

      doc.end();
    });
  }
}