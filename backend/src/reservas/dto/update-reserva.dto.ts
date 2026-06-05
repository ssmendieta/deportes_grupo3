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
    enum: ["Pendiente", "confirmada", "cancelada"],
  })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiPropertyOptional({ example: "2026-06-15" })
  @IsOptional()
  @IsDateString()
  fecha_reserva?: string;

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

  @ApiPropertyOptional({ example: "entrenamiento" })
  @IsOptional()
  @IsString()
  tipo_reserva?: string;

  @ApiPropertyOptional({ example: "Juan Pérez" })
  @IsOptional()
  @IsString()
  nombre_solicitante?: string;

  @ApiPropertyOptional({ example: 12345678 })
  @IsOptional()
  @IsInt()
  ci?: number;

  @ApiPropertyOptional({ example: "LP" })
  @IsOptional()
  @IsString()
  complemento?: string;

  @ApiPropertyOptional({ example: "juan@ucb.edu.bo" })
  @IsOptional()
  @IsString()
  correo_solicitante?: string;

  @ApiPropertyOptional({ example: "Entrenamiento de vóleibol" })
  @IsOptional()
  @IsString()
  motivo?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  espacio_id?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  id_persona_aprobador?: number;
}
