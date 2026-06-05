import { IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateDisciplinaDto {
  @ApiProperty({ example: "Voleibol", description: "Nombre de la disciplina" })
  @IsString()
  @Length(2, 50)
  nombre_disciplina!: string;
}
