import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { IS_PUBLIC_KEY } from "./public.decorator";
import {
  INTERNAL_KEY_HEADER,
  USER_ID_HEADER,
  USER_PRIVILEGIOS_HEADER,
  USER_ROL_HEADER,
  USER_ROLES_HEADER,
} from "../atoms/auth-user";
import type { AuthUser } from "../atoms/auth-user";

/**
 * Los microservicios internos (todo excepto api-gateway) NUNCA se exponen
 * directamente al público en un despliegue real. Este guard es la última
 * línea de defensa en desarrollo: exige la llave compartida `x-internal-key`
 * (la misma que usa el api-gateway al reenviar peticiones) y, si la petición
 * viene en representación de un usuario final, adjunta su identidad ya
 * validada (`request.authUser`) a partir de los headers que el gateway
 * propaga tras validar el JWT.
 *
 * Excepción: rutas marcadas con `@Public()` (p. ej. `/health`) — las
 * plataformas de despliegue (Railway, etc.) necesitan poder chequear salud
 * sin conocer la llave interna.
 */
@Injectable()
export class GatewayKeyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { authUser?: AuthUser }>();
    const key = request.header(INTERNAL_KEY_HEADER);
    const expected = process.env.INTERNAL_KEY;

    if (!expected || key !== expected) {
      throw new ForbiddenException("Petición no autorizada: falta o es inválida la llave interna.");
    }

    const userId = request.header(USER_ID_HEADER);
    if (userId) {
      const rol = request.header(USER_ROL_HEADER) as AuthUser["rol"];
      const rolesRaw = request.header(USER_ROLES_HEADER);
      const privilegiosRaw = request.header(USER_PRIVILEGIOS_HEADER);
      request.authUser = {
        id: userId,
        rol,
        roles: rolesRaw ? JSON.parse(rolesRaw) : [rol],
        privilegios: privilegiosRaw ? JSON.parse(privilegiosRaw) : [],
      };
    }

    return true;
  }
}
