import { ApiProperty } from "@nestjs/swagger";
import {
  IsInt,
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
  fecha!: string;

  @ApiProperty({ example: "14:00", description: "Hora de inicio" })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: "hora_inicio debe ser HH:MM" })
  hora_inicio!: string;

  @ApiProperty({ example: "16:00", description: "Hora de fin" })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: "hora_fin debe ser HH:MM" })
  hora_fin!: string;

  @ApiProperty({ example: 2, description: "ID de la disciplina deportiva" })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  disciplina_id!: number;

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

  @ApiProperty({ example: "1234567 LP", description: "Documento de identidad" })
  @IsString()
  carnet!: string;
}
