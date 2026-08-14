import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import Redis from "ioredis";

/**
 * Limita solicitudes de recuperación de contraseña por IP+correo (Redis, INCR +
 * EXPIRE de ventana deslizante). Antes /auth/recuperar era un stub que no
 * mandaba correo real; ahora que sí dispara un envío por Resend, sin este
 * guard cualquiera podría spamear la bandeja de un correo ajeno o agotar la
 * cuota de la cuenta de Resend.
 */
@Injectable()
export class RecuperarRateLimitGuard implements CanActivate, OnModuleDestroy {
  private readonly redis: Redis;
  private readonly max: number;
  private readonly windowSeconds: number;

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis(this.config.getOrThrow<string>("REDIS_URL"));
    this.max = Number(this.config.get("RECUPERAR_RATE_LIMIT_MAX") ?? 5);
    this.windowSeconds = Number(this.config.get("RECUPERAR_RATE_LIMIT_WINDOW_SECONDS") ?? 300);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const correo = (request.body as { correo?: string } | undefined)?.correo ?? "desconocido";
    const key = `recuperar-rate-limit:${request.ip}:${correo}`;

    const intentos = await this.redis.incr(key);
    if (intentos === 1) {
      await this.redis.expire(key, this.windowSeconds);
    }

    if (intentos > this.max) {
      throw new HttpException(
        "Demasiadas solicitudes de recuperación. Intenta de nuevo en unos minutos.",
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    return true;
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}
