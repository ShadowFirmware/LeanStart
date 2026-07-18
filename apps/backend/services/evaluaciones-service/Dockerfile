FROM node:22-bookworm-slim

RUN npm install -g pnpm@11.13.0

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm --filter @leanstart/backend-commons build
RUN pnpm --filter @leanstart/evaluaciones-service exec prisma generate
RUN pnpm --filter @leanstart/evaluaciones-service build

WORKDIR /app/services/evaluaciones-service
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm start:prod"]
