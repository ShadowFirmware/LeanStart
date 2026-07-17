import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";

export interface ScalarSetupOptions {
  title: string;
  description: string;
  version?: string;
  /** Requiere Bearer JWT en Scalar/Swagger (todo salvo api-gateway lo deja en false: ahí no se valida JWT). */
  bearerAuth?: boolean;
}

/**
 * Encapsula el boilerplate de documentación (DocumentBuilder + SwaggerModule + Scalar)
 * para no repetirlo en cada servicio. Expone:
 *  - GET /docs      → Scalar (UI principal)
 *  - GET /api       → Swagger UI clásico
 *  - GET /api-json  → OpenAPI JSON crudo (para Apidog/Postman)
 */
export function setupApiDocs(app: INestApplication, options: ScalarSetupOptions): void {
  const builder = new DocumentBuilder()
    .setTitle(options.title)
    .setDescription(options.description)
    .setVersion(options.version ?? "1.0");

  if (options.bearerAuth) {
    builder.addBearerAuth();
  }

  const config = builder.build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup("api", app, document);

  app.use(
    "/docs",
    apiReference({
      content: document,
    })
  );
}
