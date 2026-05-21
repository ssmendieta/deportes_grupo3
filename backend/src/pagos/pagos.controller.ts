import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  Req,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { ApiOperation, ApiTags, ApiQuery } from "@nestjs/swagger";
import { PagosService } from "./pagos.service";
import { CreatePagoDto } from "./dto/create-pago.dto";
import { ReportesService } from "../reportes/reportes.service";

@ApiTags("pagos")
@Controller("api/pagos")
export class PagosController {
  constructor(
    private readonly pagosService: PagosService,
    private readonly reportesService: ReportesService // <-- Tu servicio inyectado
  ) {}

  @Get("conceptos")
  @ApiOperation({ summary: "Listar conceptos de pago" })
  getConceptos(@Query("disciplinaId") disciplinaId?: string) {
    return this.pagosService.getConceptos(
      disciplinaId ? parseInt(disciplinaId) : undefined,
    );
  }

  @Get("planilla")
  @ApiOperation({ summary: "Ver planilla de pagos por disciplina y año" })
  getPlanilla(
    @Query("disciplinaId", ParseIntPipe) disciplinaId: number,
    @Query("anio", ParseIntPipe) anio: number,
  ) {
    return this.pagosService.getPlanilla(disciplinaId, anio);
  }

  @Get("morosos")
  @ApiOperation({ summary: "Listar deportistas con pagos pendientes" })
  getMorosos(
    @Query("disciplinaId") disciplinaId?: string,
    @Query("anio") anio?: string,
  ) {
    return this.pagosService.getMorosos(
      disciplinaId ? parseInt(disciplinaId) : undefined,
      anio ? parseInt(anio) : undefined,
    );
  }

  // 👇 AQUÍ ESTÁ TU ÚLTIMO ENDPOINT (Punto 9 - Pagos) 👇
  @Get("reporte")
  @ApiOperation({
    summary: "Exportar reporte de pagos",
    description: "Genera un archivo Excel o PDF con el historial de ingresos financieros.",
  })
  @ApiQuery({ name: "formato", required: true, type: String, example: "excel" })
  @ApiQuery({ name: "mes", required: false, type: String, description: "Mes (nombre: enero, febrero… o número 1-12)" })
  @ApiQuery({ name: "anio", required: false, type: String, description: "Año del pago" })
  async descargarReporte(
    @Query("formato") formato: "pdf" | "excel",
    @Res() res: Response,
    @Query("mes") mes?: string,
    @Query("anio") anio?: string
  ) {
    let pagos: any[] = await this.pagosService.findAll();

    const MESES: Record<string, number> = {
      enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
      julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
    };
    const numeroMes = mes ? (MESES[mes.toLowerCase()] ?? parseInt(mes)) : undefined;

    if (numeroMes !== undefined || anio) {
      pagos = pagos.filter((p) => {
        if (!p.fecha_pago) return false;
        const f = new Date(p.fecha_pago);
        const coincideMes = numeroMes !== undefined ? (f.getUTCMonth() + 1) === numeroMes : true;
        const coincideAnio = anio ? f.getUTCFullYear() === parseInt(anio) : true;
        return coincideMes && coincideAnio;
      });
    }

    const datosFormateados = pagos.map((p) => ({
      id: p.id,
      monto: `${p.monto} Bs.`,
      concepto: p.concepto?.nombre || "Mensualidad",
      fecha: new Date(p.fecha_pago).toLocaleDateString("es-BO"),
      estado: p.estado ? p.estado.toUpperCase() : "COMPLETADO",
    }));

    const columnas = [
      { header: "ID Pago", key: "id" },
      { header: "Monto", key: "monto" },
      { header: "Concepto", key: "concepto" },
      { header: "Fecha de Pago", key: "fecha" },
      { header: "Estado", key: "estado" },
    ];

    const titulo = "Reporte de Ingresos - Academias Deportivas UCB";
    let buffer: Buffer;

    if (formato === "excel") {
      buffer = await this.reportesService.generarExcel(titulo, columnas, datosFormateados);
      res.set({
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=reporte_pagos.xlsx",
      });
    } else {
      buffer = await this.reportesService.generarPdfTabla(titulo, columnas, datosFormateados);
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=reporte_pagos.pdf",
      });
    }

    res.send(buffer);
  }
  // 👆 FIN DEL ÚLTIMO ENDPOINT 👆

  @Get("deportista/:id")
  @ApiOperation({ summary: "Historial de pagos de un deportista" })
  getPagosDeportista(@Param("id", ParseIntPipe) id: number) {
    return this.pagosService.getPagosDeportista(id);
  }

  @Post()
  @ApiOperation({ summary: "Registrar un pago manual" })
  registrarPago(@Body() dto: CreatePagoDto, @Req() req: any) {
    const registrado_por = req.user?.id ?? 0;
    return this.pagosService.registrarPago(dto, registrado_por);
  }

  @Patch(":id/anular")
  @ApiOperation({ summary: "Anular un pago" })
  anularPago(@Param("id", ParseIntPipe) id: number) {
    return this.pagosService.anularPago(id);
  }
}