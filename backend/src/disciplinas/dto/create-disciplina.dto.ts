import { IsString, Length, IsOptional, IsInt, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateDisciplinaDto {
  @ApiProperty({
    description: "Nombre de la disciplina deportiva.",
    minLength: 2,
    maxLength: 50,
    example: "Voleibol",
  })
  @IsString()
  @Length(2, 50, { message: "El nombre debe tener entre 2 y 50 caracteres" })
  nombre!: string;

  @ApiPropertyOptional({
    description: "Descripción general de la disciplina.",
    example: "Deporte de conjunto jugado en cancha dividida por una red.",
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({
    description:
      "Orden de visualización en listados. Debe ser un entero mayor a 0.",
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  orden?: number;
}
