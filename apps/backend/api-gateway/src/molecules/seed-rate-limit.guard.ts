import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import Redis from "ioredis";

/**
 * Limita intentos de validación de semilla por IP usando Redis (INCR + EXPIRE
 * de ventana deslizante simple). A propósito NO se filtra por nombre/semilla:
 * el espacio de códigos de 4 dígitos es pequeño (~10 000), así que limitar
 * solo por el código probado dejaría fuerza bruta libre repartiendo intentos
 * entre nombres distintos. /auth/seeds/validate no tiene sesión (lo llama la
 * skill de Alexa, no el navegador), por eso el rate limit vive en el borde
 * público del gateway y no en auth-service.
 */
@Injectable()
export class SeedRateLimitGuard implements CanActivate, OnModuleDestroy {
  private readonly redis: Redis;
  private readonly max: number;
  private readonly windowSeconds: number;

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis(this.config.getOrThrow<string>("REDIS_URL"));
    this.max = Number(this.config.get("SEED_RATE_LIMIT_MAX") ?? 20);
    this.windowSeconds = Number(this.config.get("SEED_RATE_LIMIT_WINDOW_SECONDS") ?? 60);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const key = `seed-rate-limit:${request.ip}`;

    const intentos = await this.redis.incr(key);
    if (intentos === 1) {
      await this.redis.expire(key, this.windowSeconds);
    }

    if (intentos > this.max) {
      throw new HttpException("Demasiados intentos. Intenta de nuevo en un minuto.", HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}
