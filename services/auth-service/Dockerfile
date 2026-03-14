# Build from repo root: docker build -f services/auth-service/Dockerfile .
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages ./packages
COPY services/auth-service ./services/auth-service

RUN npm ci
RUN npm run build --workspace=@ai-learning-platform/shared
RUN npm run build --workspace=@ai-learning-platform/auth-service

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app/package.json /app/package-lock.json* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services/auth-service ./services/auth-service

RUN npm prune --omit=dev

EXPOSE 3001

CMD ["node", "services/auth-service/dist/index.js"]
