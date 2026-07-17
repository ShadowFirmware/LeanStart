import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { configurarLimiteBody, setupApiDocs } from "@leanstart/backend-commons";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const port = process.env.PORT ?? 4002;
  configurarLimiteBody(app);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  setupApiDocs(app, {
    title: "LeanStart · Empresas Service",
    description: "Empresas, Lean Canvas, productos/servicios, hipótesis y observaciones.",
  });

  await app.listen(port);
  console.log(`empresas-service escuchando en http://localhost:${port}`);
  console.log(`Scalar docs en http://localhost:${port}/docs`);
  console.log(`OpenAPI JSON en http://localhost:${port}/api-json`);
}
bootstrap();
