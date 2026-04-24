import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
} from "class-validator";

export class UpdateReservaDto {
  @ApiPropertyOptional({
    example: "confirmada",
    enum: ["confirmada", "cancelada"],
  })
  @IsOptional()
  @IsString()
  estado?: "confirmada" | "cancelada";

  @ApiPropertyOptional({ example: "2025-06-15" })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({ example: "14:00" })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  hora_inicio?: string;

  @ApiPropertyOptional({ example: "16:00" })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  hora_fin?: string;

  @ApiPropertyOptional({ example: "Juan Pérez" })
  @IsOptional()
  @IsString()
  nombre_solicitante?: string;

  @ApiPropertyOptional({ example: "12345678" })
  @IsOptional()
  @IsString()
  carnet?: string;

  @ApiPropertyOptional({ example: "Entrenamiento de vóleibol" })
  @IsOptional()
  @IsString()
  motivo?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  disciplina_id?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  espacio_id?: number;
}
