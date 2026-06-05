import { ApiProperty } from "@nestjs/swagger";
import {
  IsInt,
  IsPositive,
  IsNumber,
  IsString,
  IsDateString,
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
  id_transaccion_caja!: string;

  @ApiProperty({ example: 120.0, description: "Monto pagado" })
  @IsNumber()
  monto_pagado!: number;

  @ApiProperty({ example: "2026-04-30", description: "Fecha del pago" })
  @IsDateString()
  fecha_pago!: string;

  @ApiProperty({ example: 3, description: "Mes correspondiente (1-12)" })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes_correspondiente!: number;

  @ApiProperty({ example: 2026, description: "Gestión (año)" })
  @Type(() => Number)
  @IsInt()
  gestion!: number;
}
