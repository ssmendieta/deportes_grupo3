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
import { DeportistasService } from "./deportistas.service";
import { CreateDeportistaDto } from "./dto/create-deportista.dto";

@ApiTags("Deportistas")
@ApiBearerAuth()
@Controller("api/deportistas")
export class DeportistasController {
  constructor(private readonly deportistasService: DeportistasService) {}

  @Get()
  @ApiOperation({
    summary: "Listar todos los deportistas",
    description:
      "Retorna una lista paginada de deportistas con filtros opcionales por tipo, disciplina y estado.",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Número de página (default: 1)",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Resultados por página (default: 20)",
    example: 20,
  })
  @ApiQuery({
    name: "tipo",
    required: false,
    type: String,
    description: "Filtrar por tipo de deportista",
    example: "estudiante_ucb",
  })
  @ApiQuery({
    name: "disciplinaId",
    required: false,
    type: Number,
    description: "Filtrar por ID de disciplina",
    example: 15,
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
    description: "Lista de deportistas obtenida exitosamente.",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de autenticación inválido o ausente.",
  })
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("tipo") tipo?: string,
    @Query("disciplinaId") disciplinaId?: string,
    @Query("activo") activo?: string,
  ) {
    return this.deportistasService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      tipo,
      disciplinaId,
      activo,
    );
  }

  @Get("buscar")
  @ApiOperation({
    summary: "Buscar deportista por CI",
    description:
      "Busca un deportista usando su Cédula de Identidad (CI). Útil para verificar si ya está registrado antes de crear uno nuevo.",
  })
  @ApiQuery({
    name: "ci",
    required: true,
    type: String,
    description: "Número de CI del deportista",
    example: "12345678",
  })
  @ApiResponse({ status: HttpStatus.OK, description: "Deportista encontrado." })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "No existe ningún deportista con ese CI.",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de autenticación inválido o ausente.",
  })
  buscarPorCi(@Query("ci") ci: string) {
    return this.deportistasService.buscarPorCi(ci);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Obtener deportista por ID",
    description: "Retorna los datos completos de un deportista específico.",
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "ID único del deportista",
    example: 1,
  })
  @ApiResponse({ status: HttpStatus.OK, description: "Deportista encontrado." })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Deportista no encontrado.",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de autenticación inválido o ausente.",
  })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.deportistasService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: "Registrar nuevo deportista",
    description:
      "Crea un nuevo deportista en el sistema. El CI debe ser único.",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Deportista creado exitosamente.",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Datos inválidos o CI ya registrado.",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de autenticación inválido o ausente.",
  })
  create(@Body() createDeportistaDto: CreateDeportistaDto) {
    return this.deportistasService.create(createDeportistaDto);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Actualizar datos del deportista",
    description:
      "Actualiza parcialmente los datos de un deportista existente. Solo se modifican los campos enviados.",
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "ID único del deportista",
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Deportista actualizado exitosamente.",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Deportista no encontrado.",
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
    return this.deportistasService.update(id, updateDto);
  }

  @Patch(":id/estado")
  @ApiOperation({
    summary: "Cambiar estado del deportista",
    description:
      "Activa o desactiva un deportista sin eliminarlo del sistema (soft enable/disable).",
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "ID único del deportista",
    example: 1,
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["activo"],
      properties: {
        activo: {
          type: "boolean",
          description: "Nuevo estado del deportista",
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
    description: "Deportista no encontrado.",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de autenticación inválido o ausente.",
  })
  cambiarEstado(
    @Param("id", ParseIntPipe) id: number,
    @Body("activo") activo: boolean,
  ) {
    return this.deportistasService.cambiarEstado(id, activo);
  }

  @Post(":id/inscripciones")
  @ApiOperation({
    summary: "Inscribir deportista en una disciplina",
    description:
      "Crea una nueva inscripción para el deportista en una disciplina específica. Opcionalmente define categoría y nivel.",
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "ID único del deportista",
    example: 1,
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["disciplinaId"],
      properties: {
        disciplinaId: {
          type: "number",
          description: "ID de la disciplina",
          example: 3,
        },
        categoria: {
          type: "string",
          description: "Categoría del deportista",
          example: "juvenil",
        },
        nivel: {
          type: "string",
          description: "Nivel de competencia del deportista",
          example: "intermedio",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Inscripción creada exitosamente.",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Ya existe una inscripción activa en esa disciplina.",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Deportista o disciplina no encontrada.",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de autenticación inválido o ausente.",
  })
  inscribir(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: { disciplinaId: number; categoria?: string; nivel?: string },
  ) {
    return this.deportistasService.inscribir(id, body);
  }

  @Get(":id/inscripciones")
  @ApiOperation({
    summary: "Obtener inscripciones del deportista",
    description:
      "Retorna todas las inscripciones (activas e inactivas) de un deportista.",
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "ID único del deportista",
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lista de inscripciones obtenida exitosamente.",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Deportista no encontrado.",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de autenticación inválido o ausente.",
  })
  obtenerInscripciones(@Param("id", ParseIntPipe) id: number) {
    return this.deportistasService.obtenerInscripciones(id);
  }
}
