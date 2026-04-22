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
