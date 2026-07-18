FROM node:22-bookworm-slim

RUN npm install -g pnpm@11.13.0

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm --filter @leanstart/backend-commons build

WORKDIR /app/api-gateway
RUN pnpm build

CMD ["sh", "-c", "pnpm start:prod"]
