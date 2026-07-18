FROM node:22-bookworm-slim

RUN npm install -g pnpm@11.13.0

WORKDIR /app
COPY . .

# Solo para que "prisma generate" (postinstall) pueda resolver DATABASE_URL al
# construir la imagen — nunca se conecta de verdad. Railway inyecta el valor
# real en tiempo de ejecución, que es lo que usa "prisma migrate deploy" abajo.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @leanstart/backend-commons build

WORKDIR /app/services/notificaciones-service
RUN pnpm build

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm start:prod"]
