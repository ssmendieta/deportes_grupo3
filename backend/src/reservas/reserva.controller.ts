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

@ApiTags("reservas")
@ApiSecurity("permisos-rol")
@Controller("api/reservas")
export class ReservasController {
  constructor(
    private readonly reservasService: ReservasService,
    private readonly reportesService: ReportesService // <-- Tu servicio inyectado
  ) {}

  @Get()
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

  // 👇 AQUÍ ESTÁ TU NUEVO ENDPOINT (Punto 9 - Reservas) 👇
  @Get("reporte")
  @ApiOperation({
    summary: "Exportar reporte de reservas",
    description: "Genera un archivo Excel o PDF con el historial de reservas filtrado.",
  })
  @ApiQuery({ name: "formato", required: true, type: String, example: "excel" })
  @ApiQuery({ name: "espacio_id", required: false, type: String, description: "ID del espacio" })
  @ApiQuery({ name: "desde", required: false, type: String, description: "Fecha inicio (YYYY-MM-DD)" })
  @ApiQuery({ name: "hasta", required: false, type: String, description: "Fecha fin (YYYY-MM-DD)" })
  async descargarReporte(
    @Query("formato") formato: "pdf" | "excel",
    @Res() res: Response,
    @Query("espacio_id") espacio_id?: string,
    @Query("desde") desde?: string,
    @Query("hasta") hasta?: string
  ) {
    // 1. Obtener datos (filtramos por espacio si existe)
    const result = await this.reservasService.findAll(
      espacio_id ? parseInt(espacio_id) : undefined
    );
    let reservas = result.data;

    // 2. Aplicar filtros de rango de fechas en memoria
    if (desde) {
      const fechaDesde = new Date(`${desde}T00:00:00.000Z`);
      reservas = reservas.filter(r => new Date(r.fecha) >= fechaDesde);
    }
    if (hasta) {
      const fechaHasta = new Date(`${hasta}T23:59:59.999Z`);
      reservas = reservas.filter(r => new Date(r.fecha) <= fechaHasta);
    }

    // 3. Formatear los datos para que se vean bien en la tabla
    const datosFormateados = reservas.map(r => ({
      id: r.id,
      solicitante: r.nombre_solicitante || 'N/A',
      espacio: r.espacio?.nombre || 'Desconocido',
      fecha: new Date(r.fecha).toLocaleDateString("es-BO"),
      horario: `${r.hora_inicio} - ${r.hora_fin}`,
      estado: r.estado.toUpperCase()
    }));

    // 4. Definir columnas
    const columnas = [
      { header: "ID", key: "id" },
      { header: "Solicitante", key: "solicitante" },
      { header: "Espacio", key: "espacio" },
      { header: "Fecha", key: "fecha" },
      { header: "Horario", key: "horario" },
      { header: "Estado", key: "estado" }
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
  // 👆 FIN DEL NUEVO ENDPOINT 👆

  @Get(":id")
  @ApiOperation({
    summary: "Consultar una reserva específica",
    description:
      "Retorna toda la información de una reserva mediante su identificador único.",
  })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.reservasService.findOne(id);
  }

  @Get(":id/comprobante")
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
  @ApiOperation({
    summary: "Registrar nueva reserva",
    description:
      "Crea una reserva validando disponibilidad horaria, existencia de espacios y evitando conflictos con clases pre-agendadas.",
  })
  create(@Body() dto: CreateReservaDto) {
    return this.reservasService.create(dto);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Cambiar estado de la reserva",
    description:
      "Permite confirmar o cancelar una reserva. No se pueden modificar reservas que ya estén en estado 'cancelada'.",
  })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateReservaDto) {
    return this.reservasService.update(id, dto);
  }
}