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

@Controller("api/reservas")
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Get()
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
  create(@Body() dto: CreateReservaDto) {
    return this.reservasService.create(dto);
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateReservaDto) {
    return this.reservasService.update(id, dto);
  }
}
