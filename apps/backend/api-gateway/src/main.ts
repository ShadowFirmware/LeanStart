import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { configurarLimiteBody, setupApiDocs } from "@leanstart/backend-commons";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const port = process.env.PORT ?? 4000;
  const origenesPermitidos = (process.env.FRONTEND_URL ?? "http://localhost:3001")
    .split(",")
    .map((o) => o.trim());
  app.enableCors({ origin: origenesPermitidos });
  configurarLimiteBody(app);

  // Opt-in explícito (no NODE_ENV: en despliegues reales suele valer "production"
  // incluso en entornos que no están detrás de un proxy con TLS, y bloquearía todo).
  // El TLS se termina en el proxy/load balancer de enfrente; esto solo rechaza
  // tráfico que llegó como HTTP puro según lo que ese proxy reporta.
  if (process.env.ENFORCE_HTTPS === "true") {
    app.set("trust proxy", 1);
    app.use((req: import("express").Request, res: import("express").Response, next: () => void) => {
      // El healthcheck de la plataforma (Railway, etc.) le pega directo al
      // contenedor por HTTP interno, sin pasar por el proxy que añade este
      // header — si no lo exceptuamos, el propio healthcheck queda bloqueado
      // y el servicio nunca se marca como saludable.
      if (req.path === "/health") return next();
      if (req.header("x-forwarded-proto") !== "https") {
        res.status(403).json({ statusCode: 403, message: "Se requiere HTTPS." });
        return;
      }
      next();
    });
  }
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  setupApiDocs(app, {
    title: "LeanStart · API Gateway",
    description:
      "Único punto de entrada público. Valida JWT + RBAC y reenvía a auth-service, empresas-service, " +
      "evaluaciones-service y notificaciones-service. Usa el botón Authorize con un Bearer token obtenido en POST /auth/login.",
    bearerAuth: true,
  });

  await app.listen(port);
  console.log(`api-gateway escuchando en http://localhost:${port}`);
  console.log(`Scalar docs en http://localhost:${port}/docs`);
  console.log(`OpenAPI JSON en http://localhost:${port}/api-json`);
}
bootstrap();
