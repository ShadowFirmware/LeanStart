import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { IS_PUBLIC_KEY, type AuthUser } from "@leanstart/backend-commons";
import { TokenRevocationService } from "./token-revocation.service";

/**
 * Único guard que valida el JWT en todo el sistema. Tras validarlo, adjunta
 * `request.authUser` con el mismo shape que GatewayKeyGuard espera río abajo,
 * así los controllers del gateway pueden usar el `@CurrentUser()` de
 * backend-commons igual que cualquier microservicio interno.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly revocation: TokenRevocationService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { authUser?: AuthUser }>();
    const authHeader = request.header("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;
    if (!token) {
      throw new UnauthorizedException("Falta el token de acceso.");
    }

    let payload: {
      sub: string;
      rol: AuthUser["rol"];
      roles?: AuthUser["roles"];
      privilegios: AuthUser["privilegios"];
      jti?: string;
    };
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException("Token de acceso inválido o expirado.");
    }

    if (payload.jti && (await this.revocation.estaRevocado(payload.jti))) {
      throw new UnauthorizedException("La sesión fue cerrada. Inicia sesión de nuevo.");
    }

    request.authUser = {
      id: payload.sub,
      rol: payload.rol,
      roles: payload.roles ?? [payload.rol],
      privilegios: payload.privilegios ?? [],
    };
    return true;
  }
}
