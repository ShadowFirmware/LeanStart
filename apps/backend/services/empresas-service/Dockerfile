FROM node:22-bookworm-slim

RUN npm install -g pnpm@11.13.0

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @leanstart/backend-commons build

WORKDIR /app/services/empresas-service
RUN pnpm build

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm start:prod"]
