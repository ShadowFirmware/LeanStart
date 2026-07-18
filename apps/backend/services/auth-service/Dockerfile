FROM node:22-bookworm-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@11.13.0

WORKDIR /app
COPY . .

# Solo para que "prisma generate" (postinstall) pueda resolver DATABASE_URL al
# construir la imagen — nunca se conecta de verdad. Railway inyecta el valor
# real en tiempo de ejecución, que es lo que usa "prisma migrate deploy" abajo.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"

RUN pnpm install --frozen-lockfile
RUN echo "--- node-linker efectivo ---" && cat .npmrc
RUN echo "--- top-level node_modules/@prisma ---" && ls -la node_modules/@prisma 2>&1 || echo "no existe"
RUN echo "--- services/auth-service/node_modules/@prisma ---" && ls -la services/auth-service/node_modules/@prisma 2>&1 || echo "no existe"
RUN echo "--- buscando client-runtime-utils en toda la imagen ---" && find / -maxdepth 8 -iname "client-runtime-utils" 2>/dev/null
RUN pnpm --filter @leanstart/backend-commons build

WORKDIR /app/services/auth-service
RUN pnpm build

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm start:prod"]
