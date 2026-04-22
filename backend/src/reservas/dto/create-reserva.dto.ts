import { ApiProperty } from "@nestjs/swagger";

export class CreateReservaDto {
  @ApiProperty({ example: 1, description: "ID del espacio a reservar" })
  espacio_id!: number;

  @ApiProperty({ example: "2026-05-20", description: "Fecha de la reserva" })
  fecha!: string;

  @ApiProperty({ example: "09:00", description: "Hora de inicio" })
  hora_inicio!: string;

  @ApiProperty({ example: "10:00", description: "Hora de fin" })
  hora_fin!: string;

  @ApiProperty({ example: 2, description: "ID de la disciplina deportiva" })
  disciplina_id!: number;

  @ApiProperty({
    example: "Entrenamiento de equipo",
    description: "Razón de la reserva",
  })
  motivo!: string;

  @ApiProperty({
    example: "Juan Pérez",
    description: "Nombre de quien reserva",
  })
  nombre_solicitante!: string;

  @ApiProperty({ example: "1234567 LP", description: "Documento de identidad" })
  carnet!: string;
}
