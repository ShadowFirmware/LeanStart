import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import type { AuthUser } from "../atoms/auth-user";
import type { Role } from "../atoms/roles";

export const ROLES_KEY = "leanstart:roles";
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request & { authUser?: AuthUser }>();
    if (!request.authUser || !roles.some((r) => request.authUser!.roles.includes(r))) {
      throw new ForbiddenException("No tienes el rol requerido para esta acción.");
    }
    return true;
  }
}
