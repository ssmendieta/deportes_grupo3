import { Module } from '@nestjs/common';
import { DeportistasService } from './deportistas.service';
import { DeportistasController } from './deportistas.controller';

@Module({
  controllers: [DeportistasController],
  providers: [DeportistasService],
})
export class DeportistasModule {}
