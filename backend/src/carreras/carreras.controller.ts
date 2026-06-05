import { Controller, Get } from "@nestjs/common";
import { CarrerasService } from "./carreras.service";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("carreras")
@Controller("api/carreras")
export class CarrerasController {
  constructor(private readonly carrerasService: CarrerasService) {}

  @Get()
  @Roles("admin", "entrenador")
  @ApiOperation({
    summary: "Listar carreras",
    description: "Retorna las carreras activas.",
  })
  @ApiResponse({ status: 200, description: "Éxito" })
  findAll() {
    return this.carrerasService.findAll();
  }
}
