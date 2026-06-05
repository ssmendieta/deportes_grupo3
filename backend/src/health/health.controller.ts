import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'connected', timestamp: new Date().toISOString() };
    } catch {
      throw new ServiceUnavailableException('Database not available');
    }
  }
}
