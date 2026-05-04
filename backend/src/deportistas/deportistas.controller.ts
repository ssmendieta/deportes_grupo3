import { Controller, Get, Post, Body, Patch, Param, Query, ParseIntPipe } from '@nestjs/common';
import { DeportistasService } from './deportistas.service';
import { CreateDeportistaDto } from './dto/create-deportista.dto';

@Controller('api/deportistas')
export class DeportistasController {
  constructor(private readonly deportistasService: DeportistasService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tipo') tipo?: string,
    @Query('disciplinaId') disciplinaId?: string,
    @Query('activo') activo?: string,
  ) {
    return this.deportistasService.findAll(
      page ? parseInt(page) : 1, 
      limit ? parseInt(limit) : 20, 
      tipo, 
      disciplinaId, 
      activo
    );
  }

  @Get('buscar')
  buscarPorCi(@Query('ci') ci: string) {
    return this.deportistasService.buscarPorCi(ci);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.deportistasService.findOne(id);
  }

  @Post()
  create(@Body() createDeportistaDto: CreateDeportistaDto) {
    return this.deportistasService.create(createDeportistaDto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any) {
    return this.deportistasService.update(id, updateDto);
  }

  @Patch(':id/estado')
  cambiarEstado(@Param('id', ParseIntPipe) id: number, @Body('activo') activo: boolean) {
    return this.deportistasService.cambiarEstado(id, activo);
  }

  @Post(':id/inscripciones')
  inscribir(
    @Param('id', ParseIntPipe) id: number, 
    @Body() body: { disciplinaId: number, categoria?: string, nivel?: string }
  ) {
    return this.deportistasService.inscribir(id, body);
  }

  @Get(':id/inscripciones')
  obtenerInscripciones(@Param('id', ParseIntPipe) id: number) {
    return this.deportistasService.obtenerInscripciones(id);
  }
}