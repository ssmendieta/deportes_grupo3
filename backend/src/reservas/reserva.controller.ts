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
import { ApiOperation, ApiSecurity, ApiTags } from "@nestjs/swagger";

@ApiTags("reservas")
@ApiSecurity("permisos-rol")
@Controller("api/reservas")
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Get()
  @ApiOperation({
    summary: "Listado general de reservas",
    description:
      "Obtiene todas las reservas. Se puede filtrar por espacioId y por fecha (YYYY-MM-DD).",
  })
  findAll(
    @Query("espacioId") espacioId?: string,
    @Query("fecha") fecha?: string,
  ) {
    return this.reservasService.findAll(
      espacioId ? parseInt(espacioId) : undefined,
      fecha,
    );
  }

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
