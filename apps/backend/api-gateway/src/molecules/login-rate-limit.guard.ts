import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import Redis from "ioredis";

/**
 * Limita intentos de login por IP+correo usando Redis (INCR + EXPIRE de ventana
 * deslizante simple). Protege /auth/login de fuerza bruta sin tocar el
 * auth-service (la política de rate limit es responsabilidad del borde público).
 */
@Injectable()
export class LoginRateLimitGuard implements CanActivate, OnModuleDestroy {
  private readonly redis: Redis;
  private readonly max: number;
  private readonly windowSeconds: number;

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis(this.config.getOrThrow<string>("REDIS_URL"));
    this.max = Number(this.config.get("LOGIN_RATE_LIMIT_MAX") ?? 10);
    this.windowSeconds = Number(this.config.get("LOGIN_RATE_LIMIT_WINDOW_SECONDS") ?? 60);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const correo = (request.body as { email?: string } | undefined)?.email ?? "desconocido";
    const key = `login-rate-limit:${request.ip}:${correo}`;

    const intentos = await this.redis.incr(key);
    if (intentos === 1) {
      await this.redis.expire(key, this.windowSeconds);
    }

    if (intentos > this.max) {
      throw new HttpException(
        "Demasiados intentos de login. Intenta de nuevo en un minuto.",
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    return true;
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}
