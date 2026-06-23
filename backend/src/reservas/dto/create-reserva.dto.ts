import { ApiProperty } from "@nestjs/swagger";
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsDateString,
  Matches,
  MinLength,
  MaxLength,
  IsEmail,
} from "class-validator";
import { Type } from "class-transformer";

const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateReservaDto {
  @ApiProperty({ example: 1, description: "ID del espacio a reservar" })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  espacio_id!: number;

  @ApiProperty({ example: "2026-05-20", description: "Fecha de la reserva" })
  @IsDateString()
  fecha_reserva!: string;

  @ApiProperty({ example: "14:00", description: "Hora de inicio (HH:MM)" })
  @IsString()
  @Matches(HORA_REGEX, { message: "hora_inicio debe ser una hora válida en formato HH:MM" })
  hora_inicio!: string;

  @ApiProperty({ example: "16:00", description: "Hora de fin (HH:MM)" })
  @IsString()
  @Matches(HORA_REGEX, { message: "hora_fin debe ser una hora válida en formato HH:MM" })
  hora_fin!: string;

  @ApiProperty({
    example: "entrenamiento",
    description: "Tipo de reserva (e.g. entrenamiento, partido, evento)",
  })
  @IsString()
  tipo_reserva!: string;

  @ApiProperty({
    example: "Entrenamiento de equipo",
    description: "Razón de la reserva",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  motivo?: string;

  @ApiProperty({
    example: "Juan Pérez",
    description: "Nombre de quien reserva",
  })
  @IsString()
  @MinLength(2)
  nombre_solicitante!: string;

  @ApiProperty({ example: 12345678, description: "Cédula de Identidad (número)" })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  ci!: number;

  @ApiProperty({
    example: "LP",
    description: "Complemento de CI",
    required: false,
  })
  @IsOptional()
  @IsString()
  complemento?: string;

  @ApiProperty({
    example: "juan.perez@ucb.edu.bo",
    description: "Correo del solicitante para comprobante",
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: "correo_solicitante debe ser un email válido" })
  correo_solicitante?: string;

  @ApiProperty({
    example: 1,
    description: "ID de la persona que aprueba la reserva",
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id_persona_aprobador?: number;

  @ApiProperty({
    example: 1,
    description: "ID de la persona solicitante (se resuelve automáticamente desde el correo)",
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id_solicitante?: number;
}
