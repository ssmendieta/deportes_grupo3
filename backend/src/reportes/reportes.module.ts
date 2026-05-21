import { Global, Module } from '@nestjs/common';
import { ReportesService } from './reportes.service';

@Global()
@Module({
  providers: [ReportesService],
  exports: [ReportesService], 
})
export class ReportesModule {}