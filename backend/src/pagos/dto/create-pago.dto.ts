import { ApiProperty } from "@nestjs/swagger";
import {
  IsInt,
  IsPositive,
  IsNumber,
  IsString,
  IsNotEmpty,
  IsISO8601,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";

export class CreatePagoDto {
  @ApiProperty({ example: 1, description: "ID de la persona que registra el pago" })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id_persona_pago!: number;

  @ApiProperty({ example: 1, description: "ID del deportista beneficiario" })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id_deportista_beneficiario!: number;

  @ApiProperty({ example: 2, description: "ID del concepto de pago" })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id_concepto!: number;

  @ApiProperty({ example: "CAJA-001", description: "ID de transacción de caja" })
  @IsString()
  @IsNotEmpty({ message: "id_transaccion_caja es obligatorio" })
  id_transaccion_caja!: string;

  @ApiProperty({ example: 120.0, description: "Monto pagado" })
  @IsNumber()
  @IsPositive({ message: "monto_pagado debe ser mayor a 0" })
  monto_pagado!: number;

  @ApiProperty({ example: "2026-04-30", description: "Fecha del pago" })
  @IsISO8601({ strict: true }, { message: "fecha_pago debe ser una fecha ISO válida" })
  fecha_pago!: string;

  @ApiProperty({ example: 3, description: "Mes correspondiente (0=matrícula, 1-12=mensualidad)" })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(12)
  mes_correspondiente!: number;

  @ApiProperty({ example: 2026, description: "Gestión (año)" })
  @Type(() => Number)
  @IsInt()
  @Min(2000, { message: "gestión fuera de rango" })
  @Max(2100, { message: "gestión fuera de rango" })
  gestion!: number;
}
