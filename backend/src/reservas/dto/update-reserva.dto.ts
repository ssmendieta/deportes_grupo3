import { ApiProperty } from "@nestjs/swagger";

export class UpdateReservaDto {
  @ApiProperty({
    example: "confirmada",
    enum: ["confirmada", "cancelada"],
    description: "El nuevo estado de la reserva",
  })
  estado!: "confirmada" | "cancelada";
}
