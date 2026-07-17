import type { NestExpressApplication } from "@nestjs/platform-express";

/**
 * El límite por defecto de body-parser (100kb) es insuficiente para payloads
 * con imágenes en data URL (logo de empresa, imágenes de producto, avatar) —
 * sin esto, esas peticiones fallan con `PayloadTooLargeError` disfrazado de 500.
 */
export function configurarLimiteBody(app: NestExpressApplication, limit = "8mb"): void {
  app.useBodyParser("json", { limit });
  app.useBodyParser("urlencoded", { limit, extended: true });
}
