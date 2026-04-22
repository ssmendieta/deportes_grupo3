import { Controller, Get } from "@nestjs/common";
import { DisciplinasService } from "./disciplinas.service";

@Controller("api/disciplinas")
export class DisciplinasController {
  constructor(private readonly disciplinasService: DisciplinasService) {}

  @Get()
  findAll() {
    return this.disciplinasService.findAll();
  }
}
