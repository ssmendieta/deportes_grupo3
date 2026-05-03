import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsPositive,
  IsDecimal,
  IsOptional,
  IsString,
  IsDateString,
  Min,
  Max,
} from "class-validator";

export class CreatePagoDto {
  @ApiProperty({ example: 1, description: "ID del deportista" })
  @IsInt()
  @IsPositive()
  deportista_id!: number;

  @ApiProperty({ example: 2, description: "ID del concepto de pago" })
  @IsInt()
  @IsPositive()
  concepto_id!: number;

  @ApiProperty({ example: 120.0, description: "Monto del pago" })
  monto!: number;

  @ApiPropertyOptional({ example: 3, description: "Mes del pago (1-9)" })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9)
  mes?: number;

  @ApiProperty({ example: 2026, description: "Año del pago" })
  @IsInt()
  anio!: number;

  @ApiProperty({ example: "2026-04-30", description: "Fecha del pago" })
  @IsDateString()
  fecha_pago!: string;

  @ApiPropertyOptional({
    example: "REC-001",
    description: "Número de comprobante",
  })
  @IsOptional()
  @IsString()
  comprobante?: string;

  @ApiPropertyOptional({ example: "Pago en efectivo" })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
