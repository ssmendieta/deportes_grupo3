import {
  IsString,
  Length,
  IsOptional,
  IsInt,
  Min,
  IsNumber,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class CreateDisciplinaDto {
  @ApiProperty({ example: "Voleibol" })
  @IsString()
  @Length(2, 50)
  nombre!: string;

  @ApiPropertyOptional({
    example: "Deporte de conjunto jugado en cancha dividida por una red.",
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ example: "Sub-14, Mayores" })
  @IsOptional()
  @IsString()
  categorias?: string;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  mensualidad?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  orden?: number;
}
