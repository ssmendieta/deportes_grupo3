import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.rol) {
      throw new ForbiddenException('No tienes permisos para acceder a este recurso');
    }

    const hasRole = requiredRoles.some((role) => user.rol.toLowerCase() === role.toLowerCase());

    if (!hasRole) {
      throw new ForbiddenException(
        `Rol "${user.rol}" no autorizado. Se requiere uno de: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
