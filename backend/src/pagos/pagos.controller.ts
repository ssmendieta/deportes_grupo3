import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { ApiOperation, ApiTags, ApiQuery } from "@nestjs/swagger";
import { PagosService } from "./pagos.service";
import { CreatePagoDto } from "./dto/create-pago.dto";
import { ReportesService } from "../reportes/reportes.service";
import { Roles } from "../auth/decorators/roles.decorator";
import { MESES_MAP } from "../common/constants/business.constants";

@ApiTags("pagos")
@Controller("api/pagos")
export class PagosController {
  constructor(
    private readonly pagosService: PagosService,
    private readonly reportesService: ReportesService
  ) {}

  @Get()
  @Roles("admin", "entrenador")
  @ApiOperation({ summary: "Listar pagos con paginación" })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 20 })
  findAll(
    @Query("page", new ParseIntPipe({ optional: true })) page?: number,
    @Query("limit", new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.pagosService.findAll(page, limit);
  }

  @Get("conceptos")
  @Roles("admin", "entrenador")
  @ApiOperation({ summary: "Listar conceptos de pago" })
  getConceptos(@Query("disciplinaId") disciplinaId?: string) {
    return this.pagosService.getConceptos(
      disciplinaId ? parseInt(disciplinaId) : undefined,
    );
  }

  @Get("planilla")
  @Roles("admin", "entrenador")
  @ApiOperation({ summary: "Ver planilla de pagos por disciplina y año" })
  getPlanilla(
    @Query("disciplinaId", ParseIntPipe) disciplinaId: number,
    @Query("anio", ParseIntPipe) anio: number,
  ) {
    return this.pagosService.getPlanilla(disciplinaId, anio);
  }

  @Get("morosos")
  @Roles("admin", "entrenador")
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

  @Get("reporte")
  @Roles("admin")
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
    const result = await this.pagosService.findAll(1, 10000);
    let pagos: any[] = result.data;

    const numeroMes = mes ? (MESES_MAP[mes.toLowerCase()] ?? parseInt(mes)) : undefined;

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

  @Get("deportista/:id")
  @Roles("admin", "entrenador")
  @ApiOperation({ summary: "Historial de pagos de un deportista" })
  getPagosDeportista(@Param("id", ParseIntPipe) id: number) {
    return this.pagosService.getPagosDeportista(id);
  }

  @Post()
  @Roles("admin")
  @ApiOperation({ summary: "Registrar un pago manual" })
  registrarPago(@Body() dto: CreatePagoDto) {
    return this.pagosService.registrarPago(dto);
  }

  @Patch(":id/anular")
  @Roles("admin")
  @ApiOperation({ summary: "Anular un pago" })
  anularPago(@Param("id", ParseIntPipe) id: number) {
    return this.pagosService.anularPago(id);
  }
}
