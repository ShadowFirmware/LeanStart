import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import Redis from "ioredis";

/**
 * Limita mensajes al asistente por usuario (INCR + EXPIRE de ventana deslizante,
 * mismo patrón que SeedRateLimitGuard). A diferencia de la semilla de Alexa, esta
 * ruta sí está autenticada — se limita por usuario (JwtAuthGuard ya corrió antes,
 * request.authUser está poblado), no por IP, porque cada mensaje le cuesta tokens
 * reales a la cuenta de Anthropic y es fácil de saturar con spam del chat.
 */
@Injectable()
export class AsistenteRateLimitGuard implements CanActivate, OnModuleDestroy {
  private readonly redis: Redis;
  private readonly max: number;
  private readonly windowSeconds: number;

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis(this.config.getOrThrow<string>("REDIS_URL"));
    this.max = Number(this.config.get("ASISTENTE_RATE_LIMIT_MAX") ?? 20);
    this.windowSeconds = Number(this.config.get("ASISTENTE_RATE_LIMIT_WINDOW_SECONDS") ?? 300);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { authUser?: { id: string } }>();
    const key = `asistente-rate-limit:${request.authUser?.id ?? request.ip}`;

    const intentos = await this.redis.incr(key);
    if (intentos === 1) {
      await this.redis.expire(key, this.windowSeconds);
    }

    if (intentos > this.max) {
      throw new HttpException("Demasiados mensajes. Espera unos minutos antes de seguir.", HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}
