import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  Req,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PagosService } from "./pagos.service";
import { CreatePagoDto } from "./dto/create-pago.dto";

@ApiTags("pagos")
@Controller("api/pagos")
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Get("conceptos")
  @ApiOperation({ summary: "Listar conceptos de pago" })
  getConceptos(@Query("disciplinaId") disciplinaId?: string) {
    return this.pagosService.getConceptos(
      disciplinaId ? parseInt(disciplinaId) : undefined,
    );
  }

  @Get("planilla")
  @ApiOperation({ summary: "Ver planilla de pagos por disciplina y año" })
  getPlanilla(
    @Query("disciplinaId", ParseIntPipe) disciplinaId: number,
    @Query("anio", ParseIntPipe) anio: number,
  ) {
    return this.pagosService.getPlanilla(disciplinaId, anio);
  }

  @Get("morosos")
  @ApiOperation({ summary: "Listar deportistas con pagos pendientes" })
  getMorosos(
    @Query("disciplinaId") disciplinaId?: string,
    @Query("anio") anio?: string,
  ) {
    return this.pagosService.getMorosos(
      disciplinaId ? parseInt(disciplinaId) : undefined,
      anio ? parseInt(anio) : undefined,
    );
  }

  @Get("deportista/:id")
  @ApiOperation({ summary: "Historial de pagos de un deportista" })
  getPagosDeportista(@Param("id", ParseIntPipe) id: number) {
    return this.pagosService.getPagosDeportista(id);
  }

  @Post()
  @ApiOperation({ summary: "Registrar un pago manual" })
  registrarPago(@Body() dto: CreatePagoDto, @Req() req: any) {
    const registrado_por = req.user?.id ?? 0;
    return this.pagosService.registrarPago(dto, registrado_por);
  }

  @Patch(":id/anular")
  @ApiOperation({ summary: "Anular un pago" })
  anularPago(@Param("id", ParseIntPipe) id: number) {
    return this.pagosService.anularPago(id);
  }
}
