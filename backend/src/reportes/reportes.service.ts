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

    const FONT_SIZE = 8;
    const marginX = 30;
    const pageWidth = 530;
    const colWidth = pageWidth / columnas.length;
    const headerHeight = 24;
    const padding = 4;
    const lineHeight = FONT_SIZE + 2;

    function drawHeader(y: number): number {
      doc.rect(marginX, y, pageWidth, headerHeight).fill('#003366');
      doc.fillColor('white').fontSize(FONT_SIZE + 1);
      columnas.forEach((col, i) => {
        const x = marginX + i * colWidth;
        doc.text(col.header, x + padding, y + 6, {
          width: colWidth - padding * 2,
          align: 'left',
        });
      });
      doc.fillColor('black').fontSize(FONT_SIZE);
      return y + headerHeight;
    }

    function rowHeight(fila: any): number {
      let maxH = lineHeight;
      for (const col of columnas) {
        const texto = String(fila[col.key] ?? '');
        if (!texto) continue;
        const h = doc.heightOfString(texto, {
          width: colWidth - padding * 2,
        });
        maxH = Math.max(maxH, h);
      }
      return maxH + padding * 2;
    }

    return new Promise((resolve) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Título
      doc.fontSize(14).fillColor('#003366').text(titulo, { align: 'center' });
      doc.moveDown(1.2);

      let y = drawHeader(doc.y);

      for (const fila of filas) {
        const rh = rowHeight(fila);

        // Línea horizontal
        doc.strokeColor('#cccccc').lineWidth(0.5)
          .moveTo(marginX, y)
          .lineTo(marginX + pageWidth, y)
          .stroke();

        // Dibujar celdas
        columnas.forEach((col, i) => {
          const x = marginX + i * colWidth;
          const texto = String(fila[col.key] ?? '');
          doc.text(texto, x + padding, y + padding, {
            width: colWidth - padding * 2,
            align: 'left',
            lineBreak: true,
          });
        });

        y += rh;

        // Salto de página con repetición de encabezado
        if (y > 720) {
          doc.addPage();
          y = drawHeader(30);
        }
      }

      // Línea de cierre
      doc.strokeColor('#cccccc').lineWidth(0.5)
        .moveTo(marginX, y)
        .lineTo(marginX + pageWidth, y)
        .stroke();

      doc.end();
    });
  }
}