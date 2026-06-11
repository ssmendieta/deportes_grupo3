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
  Res,
} from "@nestjs/common";
import { Response } from "express";
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
import { UpdateDisciplinaDto } from "./dto/update-disciplina.dto";
import { ReportesService } from "../reportes/reportes.service";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Disciplinas")
@ApiBearerAuth()
@Controller("api/disciplinas")
export class DisciplinasController {
  constructor(
    private readonly disciplinasService: DisciplinasService,
    private readonly reportesService: ReportesService
  ) {}

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
  findAll(@Query("activo") activo?: string) {
    return this.disciplinasService.findAll(activo);
  }

  @Get("reporte")
  @Roles("admin")
  @ApiOperation({
    summary: "Exportar reporte de disciplinas",
    description: "Genera un archivo Excel o PDF con la lista de disciplinas.",
  })
  @ApiQuery({
    name: "formato",
    required: true,
    type: String,
    description: "Formato del reporte: 'pdf' o 'excel'",
    example: "excel",
  })
  @ApiQuery({ name: "estado", required: false, type: String, description: "Filtrar: activas, inactivas, todas" })
  async descargarReporte(
    @Query("formato") formato: "pdf" | "excel",
    @Res() res: Response,
    @Query("estado") estado?: string,
  ) {
    const activo = estado === "activas" ? "true" : estado === "inactivas" ? "false" : undefined;
    const disciplinas = await this.disciplinasService.findAll(activo);

    const datosFormateados = disciplinas.map((d: any) => ({
      id: d.id,
      nombre: d.nombre,
      estado: d.activo ? "Activa" : "Inactiva",
    }));

    const columnas = [
      { header: "ID", key: "id" },
      { header: "Nombre", key: "nombre" },
      { header: "Estado", key: "estado" },
    ];

    const titulo = "Reporte de Disciplinas UCB";
    let buffer: Buffer;

    if (formato === "excel") {
      buffer = await this.reportesService.generarExcel(titulo, columnas, datosFormateados);
      res.set({
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=reporte_disciplinas.xlsx",
      });
    } else {
      buffer = await this.reportesService.generarPdfTabla(titulo, columnas, datosFormateados);
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=reporte_disciplinas.pdf",
      });
    }

    res.send(buffer);
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
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.disciplinasService.findOne(id);
  }

  @Post()
  @Roles("admin")
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
  @Roles("admin")
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
  update(@Param("id", ParseIntPipe) id: number, @Body() updateDto: UpdateDisciplinaDto) {
    return this.disciplinasService.update(id, updateDto);
  }

  @Patch(":id/estado")
  @Roles("admin")
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
