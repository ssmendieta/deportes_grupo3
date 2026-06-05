import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuditoriaService } from './auditoria.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('auditoria')
@Controller('api/auditoria')
export class AuditoriaController {
  constructor(private auditoriaService: AuditoriaService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Consultar registros de auditoría' })
  @ApiQuery({ name: 'entidad', required: false, type: String })
  @ApiQuery({ name: 'usuario', required: false, type: String })
  @ApiQuery({ name: 'desde', required: false, type: String, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'hasta', required: false, type: String, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  findAll(
    @Query('entidad') entidad?: string,
    @Query('usuario') usuario?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.auditoriaService.findAll({ entidad, usuario, desde, hasta, page, limit });
  }
}
