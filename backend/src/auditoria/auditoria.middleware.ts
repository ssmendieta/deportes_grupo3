import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuditoriaService } from './auditoria.service';

const AUDITED_ENTITIES: Record<string, string> = {
  '/api/reservas': 'reserva',
  '/api/deportistas': 'deportista',
  '/api/pagos': 'pago',
  '/api/disciplinas': 'disciplina',
  '/api/espacios': 'espacio',
  '/api/horarios': 'horario',
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
    const accion = this.determinarAccion(method, req.originalUrl);
    const entidadId = this.extraerEntidadId(req.originalUrl);

    let datosAnteriores: unknown = undefined;

    if (entidadId !== null && (method === 'PATCH' || method === 'DELETE')) {
      this.auditoriaService
        .obtenerDatosAnteriores(entidad, entidadId)
        .then((data) => {
          datosAnteriores = data ?? undefined;
        })
        .catch(() => {});
    }

    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode < 400 && body) {
        const registroId =
          body.id ?? body.id_pago ?? body.id_reserva ??
          body.id_deportista ?? body.id_disciplina ??
          body.id_espacio ?? entidadId ?? 0;

        this.auditoriaService.registrar({
          id_usuario: user?.id ?? undefined,
          accion,
          tabla: entidad,
          registro_id: typeof registroId === 'number' ? registroId : Number(registroId) || 0,
          datos_anteriores: datosAnteriores,
          datos_nuevos: body,
          ip_address: req.ip || req.socket?.remoteAddress,
        }).catch(() => {});
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
    if (url.includes('/anular')) return 'ANULAR';
    if (url.includes('/inscripciones')) return 'INSCRIBIR';
    if (method === 'POST') return 'CREAR';
    if (method === 'DELETE') return 'ELIMINAR';
    if (url.includes('/estado')) return 'ACTUALIZAR_ESTADO';
    return 'ACTUALIZAR';
  }

  private extraerEntidadId(url: string): number | null {
    const segments = url.split('/').filter(Boolean);
    for (let i = 1; i < segments.length; i++) {
      if (/^\d+$/.test(segments[i])) {
        const prefix = '/' + segments.slice(0, i).join('/');
        if (AUDITED_ENTITIES[prefix]) {
          return parseInt(segments[i], 10);
        }
      }
    }
    return null;
  }
}
