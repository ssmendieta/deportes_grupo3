import { IsString, IsNotEmpty, IsOptional, IsIn, ValidateIf, IsInt } from 'class-validator';

export class CreateDeportistaDto {
  @IsString()
  @IsIn(['estudiante_ucb', 'externo'])
  tipo!: string;

  @IsString()
  @IsNotEmpty()
  ci!: string;

  @IsString()
  @IsNotEmpty()
  nombre_completo!: string;

  // Solo requeridos si es estudiante_ucb
  @ValidateIf(o => o.tipo === 'estudiante_ucb')
  @IsString()
  @IsNotEmpty()
  carrera?: string;

  @ValidateIf(o => o.tipo === 'estudiante_ucb')
  @IsInt()
  @IsNotEmpty()
  semestre?: number;

  @IsOptional() @IsString() fecha_nacimiento?: string;
  @IsOptional() @IsString() genero?: string;
  @IsOptional() @IsString() telefono?: string;
  @IsOptional() @IsString() email?: string;

  // Campos para crear inscripción automáticamente
  @IsOptional() @IsInt() disciplinaId?: number;
  @IsOptional() @IsString() categoria?: string;
  @IsOptional() @IsString() nivel?: string;
}