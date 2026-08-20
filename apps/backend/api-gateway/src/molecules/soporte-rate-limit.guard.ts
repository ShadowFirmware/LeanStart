import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import type { AuthUser } from "@leanstart/backend-commons";
import Redis from "ioredis";

/**
 * Limita los reportes de soporte por usuario (Redis, INCR + EXPIRE de ventana
 * deslizante), por el mismo motivo que RecuperarRateLimitGuard: cada reporte
 * dispara un envío real por Resend, y sin tope un usuario con sesión válida
 * puede inundar el buzón del administrador y agotar la cuota de la cuenta.
 *
 * La llave va por id de usuario, no por IP: el endpoint exige token, así que
 * el usuario es el identificador fiable (varios usuarios detrás de la misma
 * IP de una universidad no deben compartir cupo).
 */
@Injectable()
export class SoporteRateLimitGuard implements CanActivate, OnModuleDestroy {
  private readonly redis: Redis;
  private readonly max: number;
  private readonly windowSeconds: number;

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis(this.config.getOrThrow<string>("REDIS_URL"));
    this.max = Number(this.config.get("SOPORTE_RATE_LIMIT_MAX") ?? 5);
    this.windowSeconds = Number(this.config.get("SOPORTE_RATE_LIMIT_WINDOW_SECONDS") ?? 600);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { authUser?: AuthUser }>();
    // JwtAuthGuard es global, así que ya corrió y dejó authUser puesto; el
    // fallback a la IP solo cubre el caso imposible de que eso cambie.
    const identidad = request.authUser?.id ?? request.ip ?? "desconocido";
    const key = `soporte-rate-limit:${identidad}`;

    const intentos = await this.redis.incr(key);
    if (intentos === 1) {
      await this.redis.expire(key, this.windowSeconds);
    }

    if (intentos > this.max) {
      throw new HttpException(
        "Enviaste demasiados reportes seguidos. Espera unos minutos antes de mandar otro.",
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    return true;
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}
