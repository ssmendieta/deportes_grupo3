import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  BadRequestException,
} from "@nestjs/common";
import { HorariosService } from "./horarios.service.js";
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";

@ApiTags("horarios")
@Controller("api/horarios-disponibles")
export class HorariosController {
  constructor(private readonly horariosService: HorariosService) {}

  @Get(":espacioId")
  @ApiOperation({
    summary: "Consultar disponibilidad de horarios",
    description: "Endpoint público.",
  })
  @ApiParam({ name: "espacioId", example: 1 })
  @ApiQuery({
    name: "fecha",
    description: "Formato YYYY-MM-DD",
    example: "2026-05-15",
  })
  @ApiResponse({ status: 200, description: "Éxito" })
  @ApiResponse({ status: 400, description: "Fecha mal formada." })
  getDisponibilidad(
    @Param("espacioId", ParseIntPipe) espacioId: number,
    @Query("fecha") fecha: string,
  ) {
    if (!fecha)
      throw new BadRequestException("El parámetro fecha es requerido.");
    return this.horariosService.getDisponibilidad(espacioId, fecha);
  }
}
