import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import type { AuthUser } from "../atoms/auth-user";

/**
 * Extrae la identidad adjuntada por GatewayKeyGuard. Si una ruta la usa,
 * implícitamente exige que la petición represente a un usuario final
 * (no una llamada servicio-a-servicio "desnuda").
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  const request = ctx.switchToHttp().getRequest<Request & { authUser?: AuthUser }>();
  if (!request.authUser) {
    throw new UnauthorizedException("Esta ruta requiere identidad de usuario.");
  }
  return request.authUser;
});
