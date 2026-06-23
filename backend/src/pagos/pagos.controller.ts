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
import { PagosSyncService } from "./pagos-sync.service";
import { CreatePagoDto } from "./dto/create-pago.dto";
import { ReportesService } from "../reportes/reportes.service";
import { Roles } from "../auth/decorators/roles.decorator";
import { MESES_MAP } from "../common/constants/business.constants";
import { OptionalParseIntPipe } from "../common/pipes/optional-parse-int.pipe";

@ApiTags("pagos")
@Controller("api/pagos")
export class PagosController {
  constructor(
    private readonly pagosService: PagosService,
    private readonly pagosSyncService: PagosSyncService,
    private readonly reportesService: ReportesService,
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

  @Get("cuentas-academia")
  @Roles("admin", "entrenador")
  @ApiOperation({ summary: "Cuentas academia con paginación, filtros y planilla" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "busqueda", required: false, type: String })
  @ApiQuery({ name: "disciplinaId", required: false, type: Number })
  @ApiQuery({ name: "mes", required: false, type: Number })
  @ApiQuery({ name: "anio", required: false, type: Number })
  @ApiQuery({ name: "estado", required: false, type: String })
  getCuentasAcademia(
    @Query("page", new ParseIntPipe({ optional: true })) page?: number,
    @Query("limit", new ParseIntPipe({ optional: true })) limit?: number,
    @Query("busqueda") busqueda?: string,
    @Query("disciplinaId", new ParseIntPipe({ optional: true })) disciplinaId?: number,
    @Query("mes", new ParseIntPipe({ optional: true })) mes?: number,
    @Query("anio", new ParseIntPipe({ optional: true })) anio?: number,
    @Query("estado") estado?: string,
  ) {
    return this.pagosService.getCuentasAcademia({ page, limit, busqueda, disciplinaId, mes, anio, estado });
  }

  @Get("conceptos")
  @Roles("admin", "entrenador")
  @ApiOperation({ summary: "Listar conceptos de pago" })
  getConceptos(@Query("disciplinaId", new OptionalParseIntPipe()) disciplinaId?: number) {
    return this.pagosService.getConceptos(disciplinaId);
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
    @Query("disciplinaId", new OptionalParseIntPipe()) disciplinaId?: number,
    @Query("anio", new OptionalParseIntPipe()) anio?: number,
  ) {
    return this.pagosService.getMorosos(disciplinaId, anio);
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
    const numeroMes = mes ? (MESES_MAP[mes.toLowerCase()] ?? parseInt(mes)) : undefined;
    const anioNum = anio ? parseInt(anio) : undefined;

    let fechaDesde: Date | undefined;
    let fechaHasta: Date | undefined;
    if (numeroMes !== undefined && !Number.isNaN(numeroMes)) {
      const year = anioNum && !Number.isNaN(anioNum) ? anioNum : new Date().getFullYear();
      fechaDesde = new Date(Date.UTC(year, numeroMes - 1, 1));
      fechaHasta = new Date(Date.UTC(year, numeroMes, 1));
    } else if (anioNum !== undefined && !Number.isNaN(anioNum)) {
      fechaDesde = new Date(Date.UTC(anioNum, 0, 1));
      fechaHasta = new Date(Date.UTC(anioNum + 1, 0, 1));
    }

    const CHUNK = 1000;
    let pagos: any[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const result = await this.pagosService.findAllParaReporte({
        page,
        limit: CHUNK,
        fechaDesde,
        fechaHasta,
      });
      pagos = pagos.concat(result.data);
      totalPages = result.totalPages;
      page++;
    } while (page <= totalPages);

    const datosFormateados = pagos.map((p) => ({
      id: p.id_pago,
      monto: `${p.monto_pagado} Bs.`,
      concepto: p.concepto?.nombre || "Mensualidad",
      fecha: p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString("es-BO") : "—",
      estado: p.estado_factura ? p.estado_factura.toUpperCase() : "ACTIVA",
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

  @Get("total-recaudado")
  @Roles("admin", "entrenador")
  @ApiOperation({ summary: "Total recaudado en pagos activos" })
  getTotalRecaudado(@Query("anio", new OptionalParseIntPipe()) anio?: number) {
    return this.pagosService.getTotalRecaudado(anio);
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

  @Post("sync")
  @Roles("admin")
  @ApiOperation({ summary: "Ejecutar sincronización con caja externa (usa datos mock)" })
  async ejecutarSync() {
    return this.pagosSyncService.sync();
  }

  @Get("sync/pendientes")
  @Roles("admin")
  @ApiOperation({ summary: "Listar transacciones externas pendientes de asignación" })
  async getSyncPendientes() {
    return this.pagosSyncService.getPendientes();
  }

  @Post("sync/:id/asignar")
  @Roles("admin")
  @ApiOperation({ summary: "Asignar un pago parcial a un deportista" })
  async asignarPago(
    @Param("id", ParseIntPipe) id: number,
    @Body() data: { id_deportista: number; id_concepto: number; mes_correspondiente: number; monto: number },
  ) {
    return this.pagosSyncService.asignarPago(id, data);
  }
}
