FROM node:20-bookworm-slim

RUN npm install -g pnpm@11.13.0

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm --filter @leanstart/backend-commons build
RUN pnpm --filter @leanstart/empresas-service exec prisma generate
RUN pnpm --filter @leanstart/empresas-service build

WORKDIR /app/services/empresas-service
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm start:prod"]
