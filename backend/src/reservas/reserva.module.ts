import { Module } from "@nestjs/common";
import { ReservasController } from "./reserva.controller";
import { ReservasService } from "./reservas.service";

@Module({
  controllers: [ReservasController],
  providers: [ReservasService],
})
export class ReservasModule {}
