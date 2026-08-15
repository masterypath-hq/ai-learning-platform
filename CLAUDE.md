# MasteryPath — Project Constitution

## What we are building
MasteryPath is an AI tutor platform that takes learners from beginner to mastery in
two subject areas: (1) Finance & Trading, (2) Programming & AI Engineering
(including Cybersecurity, Python, Web Dev, AI/ML, AI Engineering, DSA tracks).
Core loop: user picks a track → AI generates a personalized course → user learns
via streaming AI chat → knowledge checks + module quizzes → progress dashboard.
This is Phase 1 (MVP) ONLY. Do not build: voice calls, video generation, Pinecone
memory, mobile apps, social features, institution tier.

`masterypath-mvp-build-prompts.md` in the repo root is the original stage-by-stage
build kit this project is following. Its architecture (pnpm, Vite SPA, `apps/`
layout, `packages/types`) is aspirational — it does not match what's actually
here. This file (`CLAUDE.md`) documents the real, adapted architecture. When the
two disagree, follow this file.

## Architecture (as actually built)
- Monorepo with **npm workspaces** (`package.json` → `workspaces`), not pnpm.
  Docker Compose for local dev.
- **Next.js (React 19)** app in `frontend/` on port 3000. Talks only to the
  gateway. (The build-kit's "Vite SPA" plan was superseded by this choice.)
- **Gateway** (`services/gateway`, Express, port 4000): JWT verification, rate
  limiting, request proxying via a route map in `src/config/env.ts` (no
  hardcoded URLs).
- **Websocket service** (`services/websocket`, Socket.io + Redis adapter, port
  4001): AI token streaming to clients. Scaffolded in Stage 1; wired up in
  Stage 3.
- Internal services (Express, not meant for public traffic — currently
  published on host ports for local dev convenience, same as auth/course
  today):
  - `services/auth-service` (3001) — wraps Supabase Auth, profiles, sessions.
  - `services/course-service` (3003) — course/module/lesson CRUD, enrollment,
    placement.
  - `services/ai-service` (5002) — Claude chat tutor + course/quiz generation.
    Holds `ANTHROPIC_API_KEY`.
  - `services/progress-service` (5004) — dashboard, streaks, badges.
  - `services/assessment-service` (5005) — knowledge checks, module quizzes,
    grading.
- Supabase (Postgres) is accessed by services only, never by the frontend.
- Redis: sessions/rate-limit counters (gateway), OAuth state + email queue
  (auth-service), pub/sub for streaming and progress events (ai-service,
  websocket, progress-service from Stage 3 onward).
- Shared package `@ai-learning-platform/shared` (`packages/shared`) for
  cross-service TypeScript contracts. Existing `auth-contracts.ts` and
  `course-contracts.ts` are plain TS interfaces (pre-dating this file); new
  contracts (chat, quiz/assessment, progress, subscription) are Zod schemas
  with inferred types, per the engineering rule below. Don't rewrite the old
  ones just to make them consistent — migrate opportunistically if you're
  already touching that code.

## Engineering rules
- SOLID everywhere. Controllers → service interfaces → repository interfaces
  (see `auth-service` and `course-service` for the established
  `domain/application/infrastructure/interfaces` layering — new services
  should follow the same shape once they grow past a health check).
- Every service: `src/interfaces/http` (controllers, routes/resources,
  middleware), `src/application` (services, interfaces), `src/infrastructure`
  (concrete adapters), `src/domain` (models), `src/composition-root.ts` (wires
  concrete implementations into interfaces), `src/load-env.ts`, `src/index.ts`.
- Zod validation on every new request body. Existing endpoints that predate
  this rule are grandfathered in but should get Zod validation when modified.
- All env vars documented in root `.env.example` (this repo uses one root
  `.env`, not per-service files — keep following that).
- Every endpoint returns `{ success, data, error }` envelope for new
  endpoints. (Some existing auth/course endpoints predate this and return
  bare payloads — don't break their contracts to retrofit this.)
- Write integration tests for critical paths (auth, chat, quiz grading) with
  Jest (`jest.config.cjs` at root — this repo uses Jest, not Vitest).
- AI model: use `claude-sonnet-4-5` via the official `@anthropic-ai/sdk`, with
  streaming for chat. All AI prompts live in `ai-service/src/application/prompts/`
  as exported template functions — never inline strings in handlers.

## Product rules
- Free tier: 5 chat messages/day + 5 knowledge checks/day + 1 preview course.
  Enforced in the gateway via Redis counters (key:
  `ratelimit:{userId}:{feature}:{date}`). Chat limiting already exists
  (`chatRateLimit` middleware); knowledge-check and course limits land with
  their respective stages.
- Pro tier ($19/mo via Stripe): unlimited chat, courses, quizzes; full
  progress history.
- Finance-track AI responses MUST append a risk disclaimer when
  strategy/investment advice is implied.
- Module quiz fail → 24h cool-down before retry. Course final → 48h cool-down.
- Streaks reset at midnight UTC if no learning activity.

## Definition of done for any task
Code compiles, `docker compose up` works, endpoints tested via the service's
Postman collection or a `requests.http` file, types shared through
`@ai-learning-platform/shared` where cross-service, no `any`.
