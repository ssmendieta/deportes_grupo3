import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  BadRequestException,
} from "@nestjs/common";
import { HorariosService } from "./horarios.service";

@Controller("api/horarios-disponibles")
export class HorariosController {
  constructor(private readonly horariosService: HorariosService) {}

  @Get(":espacioId")
  getDisponibilidad(
    @Param("espacioId", ParseIntPipe) espacioId: number,
    @Query("fecha") fecha: string,
  ) {
    if (!fecha) {
      throw new BadRequestException(
        "El parámetro fecha es requerido. Formato: YYYY-MM-DD",
      );
    }
    return this.horariosService.getDisponibilidad(espacioId, fecha);
  }
}
