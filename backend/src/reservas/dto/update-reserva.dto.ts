import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsEnum,
  Matches,
  IsEmail,
} from "class-validator";
import { Type } from "class-transformer";
import { EstadoReserva } from "@prisma/client";

const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class UpdateReservaDto {
  @ApiPropertyOptional({
    example: "confirmada",
    enum: ["confirmada", "cancelada"],
  })
  @IsOptional()
  @IsEnum(EstadoReserva)
  estado?: EstadoReserva;

  @ApiPropertyOptional({ example: "2026-06-15" })
  @IsOptional()
  @IsDateString()
  fecha_reserva?: string;

  @ApiPropertyOptional({ example: "14:00" })
  @IsOptional()
  @IsString()
  @Matches(HORA_REGEX, { message: "hora_inicio debe ser una hora válida en formato HH:MM" })
  hora_inicio?: string;

  @ApiPropertyOptional({ example: "16:00" })
  @IsOptional()
  @IsString()
  @Matches(HORA_REGEX, { message: "hora_fin debe ser una hora válida en formato HH:MM" })
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
  @Type(() => Number)
  @IsInt()
  ci?: number;

  @ApiPropertyOptional({ example: "LP" })
  @IsOptional()
  @IsString()
  complemento?: string;

  @ApiPropertyOptional({ example: "juan@ucb.edu.bo" })
  @IsOptional()
  @IsEmail({}, { message: "correo_solicitante debe ser un email válido" })
  correo_solicitante?: string;

  @ApiPropertyOptional({ example: "Entrenamiento de vóleibol" })
  @IsOptional()
  @IsString()
  motivo?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  espacio_id?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_persona_aprobador?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_solicitante?: number;
}
