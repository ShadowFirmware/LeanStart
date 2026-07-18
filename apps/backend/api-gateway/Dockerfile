FROM node:20-bookworm-slim

RUN npm install -g pnpm@11.13.0

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm --filter @leanstart/api-gateway build

WORKDIR /app/api-gateway
CMD ["sh", "-c", "pnpm start:prod"]
