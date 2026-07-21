import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

const TTL_SEGUNDOS = 30;

/**
 * Presencia de sesión en Redis, ligada al jti del JWT. Mientras al menos una
 * pestaña siga mandando heartbeats (cada pocos segundos), el jti se considera
 * "vivo"; si nadie manda uno durante TTL_SEGUNDOS se asume que se cerraron
 * TODAS las pestañas/el navegador, y JwtAuthGuard deja de aceptar ese token.
 * Cerrar una sola pestaña con otra abierta no afecta (la otra sigue latiendo);
 * recargar (F5) tampoco, porque retoma el heartbeat en menos de un segundo,
 * muy por debajo del TTL.
 */
@Injectable()
export class SessionPresenceService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(config: ConfigService) {
    this.redis = new Redis(config.getOrThrow<string>("REDIS_URL"));
  }

  private key(jti: string): string {
    return `session-presente:${jti}`;
  }

  async marcarPresente(jti: string): Promise<void> {
    await this.redis.set(this.key(jti), "1", "EX", TTL_SEGUNDOS);
  }

  async estaPresente(jti: string): Promise<boolean> {
    return (await this.redis.get(this.key(jti))) !== null;
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}
