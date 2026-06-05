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
import { ReservasService } from "./reservas.service";
import { CreateReservaDto } from "./dto/create-reserva.dto";
import { UpdateReservaDto } from "./dto/update-reserva.dto";
import { ApiOperation, ApiSecurity, ApiTags, ApiQuery } from "@nestjs/swagger";
import { ReportesService } from "../reportes/reportes.service";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("reservas")
@ApiSecurity("permisos-rol")
@Controller("api/reservas")
export class ReservasController {
  constructor(
    private readonly reservasService: ReservasService,
    private readonly reportesService: ReportesService
  ) {}

  @Get()
  @Roles("admin", "entrenador")
  @ApiOperation({
    summary: "Listado general de reservas",
    description:
      "Obtiene todas las reservas. Se puede filtrar por espacioId y por fecha (YYYY-MM-DD).",
  })
  findAll(
    @Query("espacioId") espacioId?: string,
    @Query("fecha") fecha?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.reservasService.findAll(
      espacioId ? parseInt(espacioId) : undefined,
      fecha,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  @Get("reporte")
  @Roles("admin")
  @ApiOperation({
    summary: "Exportar reporte de reservas",
    description: "Genera un archivo Excel o PDF con el historial de reservas filtrado.",
  })
  @ApiQuery({ name: "formato", required: true, type: String, example: "excel" })
  @ApiQuery({ name: "desde", required: false, type: String, description: "Fecha inicio (YYYY-MM-DD)" })
  @ApiQuery({ name: "hasta", required: false, type: String, description: "Fecha fin (YYYY-MM-DD)" })
  @ApiQuery({ name: "estado", required: false, type: String, description: "Estado: confirmada, cancelada, todas" })
  async descargarReporte(
    @Query("formato") formato: "pdf" | "excel",
    @Res() res: Response,
    @Query("desde") desde?: string,
    @Query("hasta") hasta?: string,
    @Query("estado") estado?: string,
  ) {
    const result = await this.reservasService.findAll();
    let reservas = result.data;

    if (desde) {
      const fechaDesde = new Date(`${desde}T00:00:00.000Z`);
      reservas = reservas.filter((r: any) => new Date(r.fecha_reserva) >= fechaDesde);
    }
    if (hasta) {
      const fechaHasta = new Date(`${hasta}T23:59:59.999Z`);
      reservas = reservas.filter((r: any) => new Date(r.fecha_reserva) <= fechaHasta);
    }

    if (estado && estado !== "todos" && estado !== "activas") {
      reservas = reservas.filter((r: any) => r.estado === estado);
    }

    const datosFormateados = reservas.map((r: any) => ({
      id: r.id_reserva,
      solicitante: r.nombre_solicitante || "N/A",
      espacio: r.espacio_nombre || "Desconocido",
      fecha: r.fecha_reserva ? new Date(r.fecha_reserva).toLocaleDateString("es-BO") : "N/A",
      horario: `${r.hora_inicio} - ${r.hora_fin}`,
      motivo: r.motivo || "",
      estado: r.estado.toUpperCase(),
    }));

    const columnas = [
      { header: "ID", key: "id" },
      { header: "Solicitante", key: "solicitante" },
      { header: "Espacio", key: "espacio" },
      { header: "Fecha", key: "fecha" },
      { header: "Horario", key: "horario" },
      { header: "Motivo", key: "motivo" },
      { header: "Estado", key: "estado" },
    ];

    const titulo = "Reporte de Reservas de Espacios UCB";
    let buffer: Buffer;

    if (formato === "excel") {
      buffer = await this.reportesService.generarExcel(titulo, columnas, datosFormateados);
      res.set({
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=reporte_reservas.xlsx",
      });
    } else {
      buffer = await this.reportesService.generarPdfTabla(titulo, columnas, datosFormateados);
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=reporte_reservas.pdf",
      });
    }

    res.send(buffer);
  }

  @Get(":id")
  @Roles("admin", "entrenador")
  @ApiOperation({
    summary: "Consultar una reserva específica",
    description:
      "Retorna toda la información de una reserva mediante su identificador único.",
  })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.reservasService.findOne(id);
  }

  @Get(":id/comprobante")
  @Roles("admin", "entrenador")
  @ApiOperation({
    summary: "Generar y descargar comprobante PDF",
    description:
      "Genera un documento PDF con los detalles de la reserva para su descarga.",
  })
  async descargarComprobante(
    @Param("id", ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const buffer = await this.reservasService.generarComprobante(id);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=comprobante-reserva-${id}.pdf`,
      "Content-Length": buffer.length.toString(),
    });

    res.end(buffer);
  }

  @Post()
  @Roles("admin", "entrenador")
  @ApiOperation({
    summary: "Registrar nueva reserva",
    description:
      "Crea una reserva validando disponibilidad horaria, existencia de espacios y evitando conflictos con clases pre-agendadas.",
  })
  create(@Body() dto: CreateReservaDto) {
    return this.reservasService.create(dto);
  }

  @Patch(":id")
  @Roles("admin", "entrenador")
  @ApiOperation({
    summary: "Cambiar estado de la reserva",
    description:
      "Permite confirmar o cancelar una reserva. No se pueden modificar reservas que ya estén en estado 'cancelada'.",
  })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateReservaDto) {
    return this.reservasService.update(id, dto);
  }
}
