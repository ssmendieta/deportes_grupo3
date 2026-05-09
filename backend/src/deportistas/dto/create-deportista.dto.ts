import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  ValidateIf,
  IsInt,
  IsEmail,
  Matches,
  Min,
  Max,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateDeportistaDto {
  @ApiProperty({
    description:
      "Tipo de deportista. Determina qué campos adicionales son requeridos.",
    enum: ["estudiante_ucb", "externo"],
    example: "estudiante_ucb",
  })
  @IsString()
  @IsIn(["academia", "competitivo", "estudiante_ucb"])
  tipo!: string;

  @ApiProperty({
    description:
      "Cédula de Identidad del deportista. Debe ser único en el sistema.",
    example: "12345678",
  })
  @IsString()
  @IsNotEmpty()
  ci!: string;

  @ApiProperty({
    description: "Nombre completo del deportista.",
    example: "Juan Carlos Saravia",
  })
  @IsString()
  @IsNotEmpty()
  nombre_completo!: string;

  @ApiPropertyOptional({
    description:
      "Carrera universitaria. **Requerido** si `tipo` es `estudiante_ucb`.",
    example: "Ingeniería de Sistemas",
  })
  @ValidateIf((o) => o.tipo === "estudiante_ucb")
  @IsString()
  @IsNotEmpty()
  carrera?: string;

  @ApiPropertyOptional({
    description:
      "Semestre actual del estudiante. **Requerido** si `tipo` es `estudiante_ucb`.",
    minimum: 1,
    maximum: 10,
    example: 5,
  })
  @ValidateIf((o) => o.tipo === "estudiante_ucb")
  @IsInt()
  @IsNotEmpty()
  semestre?: number;

  @ApiPropertyOptional({
    description: "Fecha de nacimiento en formato ISO 8601.",
    example: "2000-04-15",
  })
  @IsOptional()
  @IsString()
  fecha_nacimiento?: string;

  @ApiPropertyOptional({
    description: "Género del deportista.",
    example: "masculino",
  })
  @IsOptional()
  @IsString()
  genero?: string;

  @ApiPropertyOptional({
    description: "Número de teléfono de contacto.",
    example: "+591 71234567",
  })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({
    description: "Correo electrónico de contacto.",
    example: "juan.mamani@ucb.edu.bo",
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description:
      "ID de disciplina para crear una inscripción automáticamente al registrar al deportista.",
    example: 3,
  })
  @IsOptional()
  @IsInt()
  disciplinaId?: number;

  @ApiPropertyOptional({
    description: "Categoría del deportista dentro de la disciplina.",
    example: "juvenil",
  })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({
    description: "Nivel de competencia dentro de la disciplina.",
    example: "intermedio",
  })
  @IsOptional()
  @IsString()
  nivel?: string;
}
