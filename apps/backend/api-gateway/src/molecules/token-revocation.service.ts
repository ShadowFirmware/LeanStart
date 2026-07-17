import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

/**
 * Lista de revocación de JWT en Redis. Un JWT normal no se puede "invalidar" antes
 * de su expiración (es autocontenido); esto permite que logout tenga efecto real:
 * el jti se marca revocado con el mismo TTL que le quedaba al token, y JwtAuthGuard
 * lo rechaza aunque la firma siga siendo válida.
 */
@Injectable()
export class TokenRevocationService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(config: ConfigService) {
    this.redis = new Redis(config.getOrThrow<string>("REDIS_URL"));
  }

  private key(jti: string): string {
    return `revoked-token:${jti}`;
  }

  async revocar(jti: string, ttlSegundos: number): Promise<void> {
    if (ttlSegundos <= 0) return;
    await this.redis.set(this.key(jti), "1", "EX", ttlSegundos);
  }

  async estaRevocado(jti: string): Promise<boolean> {
    const valor = await this.redis.get(this.key(jti));
    return valor !== null;
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}
