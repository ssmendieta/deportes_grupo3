import { Controller, Get } from "@nestjs/common";
import { DisciplinasService } from "./disciplinas.service.js";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("disciplinas")
@Controller("api/disciplinas")
export class DisciplinasController {
  constructor(private readonly disciplinasService: DisciplinasService) {}

  @Get()
  @ApiOperation({
    summary: "Obtener todas las disciplinas",
    description: "Endpoint público para listar deportes.",
  })
  @ApiResponse({ status: 200, description: "Éxito" })
  findAll() {
    return this.disciplinasService.findAll();
  }
}
