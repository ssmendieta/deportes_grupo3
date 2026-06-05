import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  ValidateIf,
  IsInt,
  IsEmail,
  IsBoolean,
  Min,
  Max,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateDeportistaDto {
  @ApiProperty({ description: "Nombres del deportista", example: "Juan Carlos" })
  @IsString()
  @IsNotEmpty()
  nombres!: string;

  @ApiProperty({ description: "Apellido paterno", example: "Saravia" })
  @IsString()
  @IsNotEmpty()
  ape_paterno!: string;

  @ApiProperty({ description: "Apellido materno", example: "Mamani" })
  @IsString()
  @IsNotEmpty()
  ape_materno!: string;

  @ApiProperty({ description: "Cédula de Identidad (número entero)", example: 12345678 })
  @IsInt()
  @IsNotEmpty()
  ci!: number;

  @ApiPropertyOptional({ description: "Complemento de CI", example: "LP" })
  @IsOptional()
  @IsString()
  complemento?: string;

  @ApiProperty({ description: "Teléfono / celular", example: "+591 71234567" })
  @IsString()
  @IsNotEmpty()
  celular!: string;

  @ApiProperty({ description: "Fecha de nacimiento ISO", example: "2000-04-15" })
  @IsString()
  @IsNotEmpty()
  fecha_nacimiento!: string;

  @ApiProperty({
    description: "Tipo de deportista",
    enum: ["academia", "competitivo", "estudiante_ucb", "exonerado"],
    example: "estudiante_ucb",
  })
  @IsString()
  @IsIn(["academia", "competitivo", "estudiante_ucb", "exonerado"])
  tipo_deportista!: string;

  @ApiPropertyOptional({ description: "Talla de ropa", example: "M" })
  @IsOptional()
  @IsString()
  talla_ropa?: string;

  @ApiPropertyOptional({
    description: "ID de carrera. Requerido si tipo es estudiante_ucb",
    example: 1,
  })
  @ValidateIf((o) => o.tipo_deportista === "estudiante_ucb")
  @IsInt()
  @IsNotEmpty()
  id_carrera?: number;

  @ApiPropertyOptional({
    description: "Semestre actual. Requerido si tipo es estudiante_ucb",
    minimum: 1,
    maximum: 12,
    example: 5,
  })
  @ValidateIf((o) => o.tipo_deportista === "estudiante_ucb")
  @IsInt()
  @Min(1)
  @Max(12)
  @IsNotEmpty()
  semestre?: number;

  @ApiPropertyOptional({ description: "Estudiante regular", example: true })
  @IsOptional()
  @IsBoolean()
  est_regular?: boolean;

  @ApiPropertyOptional({
    description: "Colegio o instituto. Requerido si tipo es competitivo",
    example: "Colegio San Calixto",
  })
  @ValidateIf((o) => o.tipo_deportista === "competitivo")
  @IsString()
  @IsNotEmpty()
  colegio_instituto?: string;

  @ApiPropertyOptional({ description: "Curso / grado", example: "6to Secundaria" })
  @IsOptional()
  @IsString()
  curso?: string;

  @ApiPropertyOptional({
    description: "Email para crear usuario del sistema",
    example: "juan.mamani@ucb.edu.bo",
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: "ID de disciplina para inscripción automática",
    example: 3,
  })
  @IsOptional()
  @IsInt()
  disciplinaId?: number;

  @ApiPropertyOptional({
    description: "ID de categoría para la inscripción (FK a CATEGORIAS)",
    example: 1,
  })
  @IsOptional()
  @IsInt()
  id_categoria?: number;
}
