import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
  import { Observable, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { RequestWithContext } from "../common/types/request.types";
import { AuditoriaService } from "./auditoria.service";

interface AuditedEntity {
  path: string;
  entity: string;
}

const AUDITED_ENTITIES: AuditedEntity[] = [
  { path: "/api/deportistas", entity: "deportista" },
  { path: "/api/deportistas/inscripciones", entity: "inscripcion" },
  { path: "/api/reservas", entity: "reserva" },
  { path: "/api/pagos", entity: "pago" },
  { path: "/api/disciplinas", entity: "disciplina" },
  { path: "/api/espacios", entity: "espacio" },
  { path: "/api/horarios", entity: "horario" },
].sort((a, b) => b.path.length - a.path.length);

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditoriaInterceptor.name);

  constructor(private auditoriaService: AuditoriaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest<RequestWithContext>();
    const method = req.method;

    if (!MUTATING_METHODS.has(method)) {
      return next.handle();
    }

    const url = this.normalizarUrl(req.originalUrl);
    const entidad = this.detectarEntidad(url);
    if (!entidad) {
      return next.handle();
    }

    const accion = this.determinarAccion(method, url);
    const entidadId = this.extraerEntidadId(url);
    const user = req.user;

    let datosAnteriores: unknown = undefined;
    if (entidadId !== null && ["PUT", "PATCH", "DELETE"].includes(method)) {
      try {
        datosAnteriores = await this.auditoriaService.obtenerDatosAnteriores(
          entidad,
          entidadId,
        );
      } catch (error) {
        this.logger.warn(
          `No se pudieron obtener datos anteriores para ${entidad}#${entidadId}: ${(error as Error).message}`,
        );
      }
    }

    return next.handle().pipe(
      tap((body: unknown) => {
        this.registrarExitosa(body, entidad, accion, entidadId, user, datosAnteriores, req);
      }),
      catchError((error) => {
        this.registrarFallida(error, entidad, accion, entidadId, user, req);
        return throwError(() => error);
      }),
    );
  }

  private normalizarUrl(url: string): string {
    try {
      return new URL(url, "http://localhost").pathname;
    } catch {
      return url.split("?")[0];
    }
  }

  private detectarEntidad(url: string): string | null {
    if (/^\/api\/deportistas\/\d+\/inscripciones/.test(url)) return "inscripcion";

    for (const { path, entity } of AUDITED_ENTITIES) {
      if (url === path || url.startsWith(path + "/")) return entity;
    }
    return null;
  }

  private determinarAccion(method: string, url: string): string {
    if (url.includes("/anular")) return "ANULAR";
    if (url.includes("/inscripciones")) return "INSCRIBIR";
    if (method === "POST") return "CREAR";
    if (method === "DELETE") return "ELIMINAR";
    if (url.includes("/estado")) return "ACTUALIZAR_ESTADO";
    return "ACTUALIZAR";
  }

  private extraerEntidadId(url: string): number | null {
    const segments = url.split("/").filter(Boolean);
    for (let i = 1; i < segments.length; i++) {
      if (/^\d+$/.test(segments[i])) {
        const prefix = "/" + segments.slice(0, i).join("/");
        if (this.esEntidadAuditada(prefix)) {
          return parseInt(segments[i], 10);
        }
      }
    }
    return null;
  }

  private esEntidadAuditada(prefix: string): boolean {
    return AUDITED_ENTITIES.some((e) => e.path === prefix);
  }

  private extraerRegistroId(
    body: unknown,
    entidadId: number | null,
  ): number {
    if (!body || typeof body !== "object") return entidadId ?? 0;

    const bodyRecord = body as Record<string, unknown>;
    const candidatos = [
      bodyRecord.id,
      bodyRecord.id_inscripcion,
      bodyRecord.id_pago,
      bodyRecord.id_reserva,
      bodyRecord.id_deportista,
      bodyRecord.id_disciplina,
      bodyRecord.id_espacio,
      bodyRecord.id_plantilla,
      entidadId,
    ];

    for (const valor of candidatos) {
      if (typeof valor === "number" && !Number.isNaN(valor)) return valor;
      if (typeof valor === "string") {
        const num = parseInt(valor, 10);
        if (!Number.isNaN(num)) return num;
      }
    }

    return 0;
  }

  private registrarExitosa(
    body: unknown,
    entidad: string,
    accion: string,
    entidadId: number | null,
    user: RequestWithContext["user"],
    datosAnteriores: unknown,
    req: RequestWithContext,
  ): void {
    if (!body || typeof body !== "object") return;

    const registroId = this.extraerRegistroId(body, entidadId);
    if (registroId === 0) {
      this.logger.warn(
        `Auditoría: no se pudo determinar registro_id para ${entidad} (${req.method} ${req.originalUrl})`,
      );
    }

    void this.auditoriaService
      .registrar({
        id_usuario: user?.id ?? undefined,
        accion,
        tabla: entidad,
        registro_id: registroId,
        datos_anteriores: datosAnteriores,
        datos_nuevos: body,
        ip_address: req.ip || req.socket?.remoteAddress,
      })
      .catch((error) => {
        this.logger.error(
          `Error al registrar auditoría: ${(error as Error).message}`,
          (error as Error).stack,
        );
      });
  }

  private registrarFallida(
    error: unknown,
    entidad: string,
    accion: string,
    entidadId: number | null,
    user: RequestWithContext["user"],
    req: RequestWithContext,
  ): void {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";

    void this.auditoriaService
      .registrar({
        id_usuario: user?.id ?? undefined,
        accion: `ERROR_${accion}`,
        tabla: entidad,
        registro_id: entidadId ?? 0,
        datos_anteriores: undefined,
        datos_nuevos: { error: mensaje },
        ip_address: req.ip || req.socket?.remoteAddress,
      })
      .catch((err) => {
        this.logger.error(
          `Error al registrar auditoría de error: ${(err as Error).message}`,
          (err as Error).stack,
        );
      });
  }
}
