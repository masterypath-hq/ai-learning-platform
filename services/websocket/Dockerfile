# Build from repo root: docker build -f services/websocket/Dockerfile .
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages ./packages
COPY services/websocket ./services/websocket

RUN npm ci
RUN npm run build --workspace=@ai-learning-platform/shared
RUN npm run build --workspace=@ai-learning-platform/websocket

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4001

COPY --from=builder /app/package.json /app/package-lock.json* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services/websocket ./services/websocket

RUN npm prune --omit=dev

EXPOSE 4001

CMD ["node", "services/websocket/dist/index.js"]
