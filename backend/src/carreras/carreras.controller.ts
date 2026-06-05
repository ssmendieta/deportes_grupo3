import { Controller, Get } from "@nestjs/common";
import { CarrerasService } from "./carreras.service";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("carreras")
@Controller("api/carreras")
export class CarrerasController {
  constructor(private readonly carrerasService: CarrerasService) {}

  @Get()
  @ApiOperation({
    summary: "Listar carreras",
    description: "Retorna las carreras activas.",
  })
  @ApiResponse({ status: 200, description: "Éxito" })
  findAll() {
    return this.carrerasService.findAll();
  }
}
