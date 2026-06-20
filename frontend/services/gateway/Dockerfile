# Build from repo root: docker build -f services/gateway/Dockerfile .
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY services/gateway ./services/gateway

RUN npm ci --workspace=@ai-learning-platform/gateway
RUN npm run build --workspace=@ai-learning-platform/gateway

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/package.json /app/package-lock.json* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/gateway ./services/gateway

RUN npm prune --omit=dev

EXPOSE 4000

CMD ["node", "services/gateway/dist/index.js"]
