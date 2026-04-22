import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  NotFoundException,
} from "@nestjs/common";
import { EspaciosService } from "./espacios.service.js";
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from "@nestjs/swagger";

@ApiTags("espacios")
@Controller("api/espacios")
export class EspaciosController {
  constructor(private readonly espaciosService: EspaciosService) {}

  @Get()
  @ApiOperation({
    summary: "Listar espacios físicos",
    description: "Endpoint público.",
  })
  @ApiResponse({ status: 200, description: "Éxito" })
  findAll() {
    return this.espaciosService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Ver detalle de un espacio" })
  @ApiParam({ name: "id", example: 1 })
  @ApiResponse({ status: 200, description: "Espacio encontrado." })
  @ApiResponse({ status: 404, description: "No encontrado." })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    const espacio = await this.espaciosService.findOne(id);
    if (!espacio)
      throw new NotFoundException(`No existe el espacio con id ${id}`);
    return espacio;
  }
}
