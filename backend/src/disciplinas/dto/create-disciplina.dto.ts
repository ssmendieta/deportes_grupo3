import { IsString, Length, IsOptional, IsInt, Min } from 'class-validator';

export class CreateDisciplinaDto {
  @IsString()
  @Length(2, 50, { message: 'El nombre debe tener entre 2 y 50 caracteres' })
  nombre!: string; 

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  orden?: number;
}