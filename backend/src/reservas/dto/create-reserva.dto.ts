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
} from "class-validator";
import { Type } from "class-transformer";

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
  @Matches(/^\d{2}:\d{2}$/, { message: "hora_inicio debe ser HH:MM" })
  hora_inicio!: string;

  @ApiProperty({ example: "16:00", description: "Hora de fin (HH:MM)" })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: "hora_fin debe ser HH:MM" })
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
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  motivo!: string;

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
  @IsString()
  correo_solicitante?: string;

  @ApiProperty({
    example: 1,
    description: "ID de la persona que aprueba la reserva",
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id_persona_aprobador!: number;
}
