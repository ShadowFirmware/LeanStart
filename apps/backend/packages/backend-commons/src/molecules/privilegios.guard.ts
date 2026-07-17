import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import type { AuthUser } from "../atoms/auth-user";
import type { Accion, Modulo } from "../atoms/roles";

export const PRIVILEGIO_KEY = "leanstart:privilegio";

export interface PrivilegioRequerido {
  modulo: Modulo;
  accion: Accion;
}

/** Espeja exactamente la regla de apps/frontend/commons/src/hooks/use-privilegios.ts */
export const RequierePrivilegio = (modulo: Modulo, accion: Accion) =>
  SetMetadata(PRIVILEGIO_KEY, { modulo, accion } satisfies PrivilegioRequerido);

@Injectable()
export class PrivilegiosGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requerido = this.reflector.getAllAndOverride<PrivilegioRequerido | undefined>(PRIVILEGIO_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requerido) return true;

    const request = context.switchToHttp().getRequest<Request & { authUser?: AuthUser }>();
    const privilegios = request.authUser?.privilegios ?? [];
    const puede = privilegios.some(
      (p) => p.modulo === requerido.modulo && p.acciones.includes(requerido.accion)
    );

    if (!puede) {
      throw new ForbiddenException(
        `No tienes el privilegio "${requerido.accion}" sobre "${requerido.modulo}".`
      );
    }
    return true;
  }
}
