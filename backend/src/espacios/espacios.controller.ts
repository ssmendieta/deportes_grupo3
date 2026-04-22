import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  NotFoundException,
} from "@nestjs/common";
import { EspaciosService } from "./espacios.service";

@Controller("api/espacios")
export class EspaciosController {
  constructor(private readonly espaciosService: EspaciosService) {}

  @Get()
  findAll() {
    return this.espaciosService.findAll();
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    const espacio = await this.espaciosService.findOne(id);
    if (!espacio)
      throw new NotFoundException(`Espacio con id ${id} no encontrado`);
    return espacio;
  }
}
