import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { DisciplinasService } from "./disciplinas.service";
import { CreateDisciplinaDto } from "./dto/create-disciplina.dto";

@ApiTags("Disciplinas")
@ApiBearerAuth()
@Controller("api/disciplinas")
export class DisciplinasController {
  constructor(private readonly disciplinasService: DisciplinasService) {}

  @Get()
  @ApiOperation({
    summary: "Listar todas las disciplinas",
    description:
      "Retorna la lista de disciplinas deportivas registradas. Se puede filtrar por estado activo/inactivo.",
  })
  @ApiQuery({
    name: "activo",
    required: false,
    type: Boolean,
    description: "Filtrar por estado activo/inactivo",
    example: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lista de disciplinas obtenida exitosamente.",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de autenticación inválido o ausente.",
  })
  findAll(@Query("activo") activo?: string) {
    return this.disciplinasService.findAll(activo);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Obtener disciplina por ID",
    description: "Retorna los datos completos de una disciplina específica.",
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "ID único de la disciplina",
    example: 1,
  })
  @ApiResponse({ status: HttpStatus.OK, description: "Disciplina encontrada." })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Disciplina no encontrada.",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de autenticación inválido o ausente.",
  })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.disciplinasService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: "Registrar nueva disciplina",
    description: "Crea una nueva disciplina deportiva en el sistema.",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Disciplina creada exitosamente.",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Datos inválidos.",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de autenticación inválido o ausente.",
  })
  create(@Body() createDisciplinaDto: CreateDisciplinaDto) {
    return this.disciplinasService.create(createDisciplinaDto);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Actualizar disciplina",
    description:
      "Actualiza parcialmente los datos de una disciplina existente. Solo se modifican los campos enviados.",
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "ID único de la disciplina",
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Disciplina actualizada exitosamente.",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Disciplina no encontrada.",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Datos inválidos.",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de autenticación inválido o ausente.",
  })
  update(@Param("id", ParseIntPipe) id: number, @Body() updateDto: any) {
    return this.disciplinasService.update(id, updateDto);
  }

  @Patch(":id/estado")
  @ApiOperation({
    summary: "Cambiar estado de la disciplina",
    description:
      "Activa o desactiva una disciplina sin eliminarla del sistema.",
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "ID único de la disciplina",
    example: 1,
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["activo"],
      properties: {
        activo: {
          type: "boolean",
          description: "Nuevo estado de la disciplina",
          example: false,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Estado actualizado exitosamente.",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Disciplina no encontrada.",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de autenticación inválido o ausente.",
  })
  cambiarEstado(
    @Param("id", ParseIntPipe) id: number,
    @Body("activo") activo: boolean,
  ) {
    return this.disciplinasService.cambiarEstado(id, activo);
  }
}
