import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { randomBytes } from 'crypto';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const ctx = context.switchToHttp();
    const res = ctx.getResponse<Response>();

    const correlationId = `REQ-${randomBytes(4).toString('hex')}`;
    (req as any).correlationId = correlationId;

    const method = req.method;
    const url = req.url;
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const user = (req as any).user?.email || (req as any).user?.sub || 'anonimo';

    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - now;
          const status = res.statusCode;
          const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'log';
          this.logger[level](
            `${method} ${url} ${status} (${duration}ms) [${correlationId}] user:${user} ip:${ip}`,
          );
        },
        error: (err: Error) => {
          const duration = Date.now() - now;
          this.logger.error(
            `${method} ${url} 500 (${duration}ms) [${correlationId}] user:${user} ip:${ip} - ${err.message}`,
          );
        },
      }),
    );
  }
}
