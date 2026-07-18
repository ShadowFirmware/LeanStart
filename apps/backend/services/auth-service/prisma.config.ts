import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` no necesita una conexión real — solo lee el schema. Usar
// process.env directo (con un valor de repuesto) en vez del helper `env()` de
// Prisma evita que la carga del config truene en el paso de build de Docker,
// donde las variables de entorno reales de Railway todavía no existen.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://build:build@localhost:5432/build",
  },
});
