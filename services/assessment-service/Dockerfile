# Build from repo root: docker build -f services/assessment-service/Dockerfile .
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages ./packages
COPY services/assessment-service ./services/assessment-service

RUN npm ci
RUN npm run build --workspace=@ai-learning-platform/shared
RUN npm run build --workspace=@ai-learning-platform/assessment-service

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5005

COPY --from=builder /app/package.json /app/package-lock.json* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services/assessment-service ./services/assessment-service

RUN npm prune --omit=dev

EXPOSE 5005

CMD ["node", "services/assessment-service/dist/index.js"]
