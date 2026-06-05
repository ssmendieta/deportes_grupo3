import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuditoriaService } from './auditoria.service';

const AUDITED_ENTITIES: Record<string, string> = {
  '/api/reservas': 'reserva',
  '/api/deportistas': 'deportista',
  '/api/pagos': 'pago',
  '/api/disciplinas': 'disciplina',
};

@Injectable()
export class AuditoriaMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuditoriaMiddleware.name);

  constructor(private auditoriaService: AuditoriaService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const method = req.method;
    if (!['POST', 'PATCH', 'DELETE'].includes(method)) {
      return next();
    }

    const entidad = this.detectarEntidad(req.originalUrl);
    if (!entidad) {
      return next();
    }

    const user = (req as any).user;
    const correlationId = (req as any).correlationId;

    const accion = this.determinarAccion(method, req.originalUrl);
    const entidadId = this.extraerEntidadId(req.originalUrl);

    const registro = {
      usuario_email: user?.email ?? 'desconocido',
      usuario_rol: user?.rol ?? 'desconocido',
      accion,
      entidad,
      entidad_id: entidadId ?? 0,
      ip: req.ip || req.socket?.remoteAddress,
      correlation_id: correlationId,
    };

    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode < 400 && body) {
        this.auditoriaService.registrar({
          ...registro,
          entidad_id: body.id ?? body.id_pago ?? body.id_reserva ?? body.id_deportista ?? body.id_disciplina ?? entidadId ?? 0,
          detalle_despues: body,
        });
      }
      return originalJson(body);
    };

    next();
  }

  private detectarEntidad(url: string): string | null {
    for (const [path, entity] of Object.entries(AUDITED_ENTITIES)) {
      if (url.startsWith(path)) return entity;
    }
    return null;
  }

  private determinarAccion(method: string, url: string): string {
    if (method === 'POST') return 'CREAR';
    if (method === 'DELETE') return 'ELIMINAR';
    if (url.includes('/anular')) return 'ANULAR';
    if (url.includes('/estado')) return 'ACTUALIZAR_ESTADO';
    if (url.includes('/inscripciones')) return 'INSCRIBIR';
    return 'ACTUALIZAR';
  }

  private extraerEntidadId(url: string): number | null {
    const parts = url.split('/').filter(Boolean);
    const idPart = parts.find((p, i) => i > 0 && /^\d+$/.test(p));
    return idPart ? parseInt(idPart) : null;
  }
}
