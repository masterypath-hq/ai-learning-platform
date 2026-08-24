# MasteryPath MVP — Claude Code Build Kit (PRD v2, Phase 1)

**How to use this kit**

1. Create a new empty repo (or a fresh branch in `masterypath-hq`).
2. Save **Prompt 0** as `CLAUDE.md` in the repo root. This is the project constitution — Claude Code reads it automatically every session.
3. Run **Stages 1–9 in order**, one stage per Claude Code session. Do NOT paste them all at once.
4. After each stage: run the app, check the acceptance criteria, commit. Only then start the next stage.
5. If Claude skips something, reply: *"Check the acceptance criteria in my last message — items X and Y are not done. Complete them before anything else."*

> **Architecture note (read once):** The PRD specifies 7 microservices. For a 2-founder, 6-week MVP, you can collapse this into a **modular monolith** (one Express app, one folder per domain, same interfaces) and split into true microservices at Phase 2 — same SOLID boundaries, ~40% less DevOps work. If you want that, add this line to every stage prompt: *"Implement services as modules inside a single Express app (modular monolith), keeping each module behind its own interface so it can be extracted into a standalone service later."* The prompts below follow the PRD's microservices layout as written.

---

## PROMPT 0 — `CLAUDE.md` (save this file in repo root, don't paste as a message)

```markdown
# MasteryPath — Project Constitution

## What we are building
MasteryPath is an AI tutor platform that takes learners from beginner to mastery in
two subject areas: (1) Finance & Trading, (2) Programming & AI Engineering
(including Cybersecurity, Python, Web Dev, AI/ML, AI Engineering, DSA tracks).
Core loop: user picks a track → AI generates a personalized course → user learns
via streaming AI chat → knowledge checks + module quizzes → progress dashboard.
This is Phase 1 (MVP) ONLY. Do not build: voice calls, video generation, Pinecone
memory, mobile apps, social features, institution tier.

## Architecture (non-negotiable)
- Monorepo with pnpm workspaces. Docker Compose for local dev.
- React 19 + Vite + TypeScript SPA on port 3000. Talks ONLY to the API Gateway.
- API Gateway (Node + Express, port 4000): JWT verification, rate limiting, routing.
- WebSocket server (Socket.io + Redis adapter, port 4001): AI token streaming.
- Internal services (Express, not exposed): auth-service (5001), ai-service (5002),
  course-service (5003), progress-service (5004), assessment-service (5005).
- Only ai-service holds the ANTHROPIC_API_KEY. Only auth-service touches Supabase Auth.
- Supabase (Postgres) is accessed by services only, never by the frontend.
- Redis (Upstash-compatible): sessions, rate limits, pub/sub.
- Shared package `@masterypath/types` for all TypeScript types and Zod schemas.

## Engineering rules
- SOLID everywhere. Controllers → service interfaces → repository interfaces.
  Concrete implementations injected, never imported directly into business logic.
- Every service: `src/controllers`, `src/services`, `src/repositories`, `src/routes`,
  `src/middleware`, `src/config`. Zod validation on every request body.
- All env vars documented in `.env.example` per service. Never hardcode secrets.
- Every endpoint returns `{ success, data, error }` envelope.
- Write integration tests for critical paths (auth, chat, quiz grading) with Vitest.
- AI model: use `claude-sonnet-4-5` via the official Anthropic TypeScript SDK,
  with streaming for chat. All AI prompts live in `ai-service/src/prompts/` as
  exported template functions — never inline strings in handlers.

## Product rules
- Free tier: 5 chat messages/day + 5 knowledge checks/day + 1 preview course.
  Enforced in the Gateway via Redis counters (key: `ratelimit:{userId}:{feature}:{date}`).
- Pro tier ($19/mo via Stripe): unlimited chat, courses, quizzes; full progress history.
- Finance-track AI responses MUST append a risk disclaimer when strategy/investment
  advice is implied.
- Module quiz fail → 24h cool-down before retry. Course final → 48h cool-down.
- Streaks reset at midnight UTC if no learning activity.

## Definition of done for any task
Code compiles, `docker compose up` works, endpoints tested via the included
`requests.http` file, types shared through @masterypath/types, no `any`.
```

---

## STAGE 1 — Monorepo scaffold

```
Read CLAUDE.md fully before doing anything.

Scaffold the MasteryPath monorepo:

1. pnpm workspace with: apps/frontend, apps/gateway, apps/websocket,
   services/auth-service, services/ai-service, services/course-service,
   services/progress-service, services/assessment-service,
   packages/types, packages/config (shared eslint/tsconfig).
2. Every app/service: TypeScript, Express (except frontend: React 19 + Vite),
   dev script with tsx watch, build script, Dockerfile.
3. docker-compose.yml wiring all services + Redis, with an internal network where
   only frontend (3000), gateway (4000) and websocket (4001) are exposed.
4. packages/types: define and export Zod schemas + inferred types for User,
   Subscription (free|pro), Course, Module, Lesson, QuizQuestion, QuizAttempt,
   ChatSession, ChatMessage, ProgressRecord, Streak. Base them on the data model
   in CLAUDE.md's product rules.
5. Root README with architecture diagram (mermaid) and run instructions.
6. A health endpoint GET /health on every service; gateway aggregates them at
   GET /api/health.

Acceptance criteria:
- `pnpm install && docker compose up` starts everything with no errors.
- `curl localhost:4000/api/health` shows all services healthy.
- `pnpm -r typecheck` passes.
Do not implement any business logic yet.
```

---

## STAGE 2 — Auth service + Gateway security

```
Read CLAUDE.md. Stage 1 is done and committed.

Build auth-service and harden the gateway:

1. auth-service wraps Supabase Auth (email/password + Google OAuth):
   POST /register, POST /login, POST /refresh, GET /me, PATCH /me.
   On register, create a row in a `profiles` table (id, email, display_name,
   subject_preference, subscription_tier default 'free', created_at).
2. Provide supabase/migrations/001_init.sql creating: profiles, courses, modules,
   lessons, quiz_attempts, chat_sessions, chat_messages, progress_records —
   matching @masterypath/types, with RLS enabled and service-role access policies.
3. Gateway: verify Supabase JWT on every /api/* route except /api/auth/*, attach
   { userId, tier } to the request, proxy to internal services via a route map in
   config (no hardcoded URLs), and add the Redis rate limiter middleware skeleton
   (limit config per feature per tier, from CLAUDE.md product rules).
4. requests.http covering register → login → GET /api/auth/me through the gateway.

Acceptance criteria:
- Register + login through the gateway returns a JWT; /api/auth/me works with it
  and 401s without it.
- Rate limiter returns 429 with a clear error body when a free-tier counter is
  exhausted (test with a low temporary limit).
- Migration runs cleanly on a fresh Supabase project.
```

---

## STAGE 3 — AI service: streaming chat tutor

```
Read CLAUDE.md. Stages 1–2 are done.

Build the core of the product — the AI chat tutor in ai-service:

1. POST /chat/sessions — create a session with { subjectArea: 'finance'|'programming',
   track, topic? }. Persist to chat_sessions.
2. POST /chat/sessions/:id/messages — accepts a user message, streams the Claude
   response token-by-token. Streaming path: ai-service publishes tokens to Redis
   pub/sub channel `chat:{sessionId}` → websocket app subscribes and emits to the
   client socket room. Persist both messages on completion.
3. Tutor system prompt (in src/prompts/tutor.ts), parameterized by subject, track,
   and inferred level. Requirements from the PRD:
   - Adaptive depth: infer the learner's level from their first 2–3 messages and
     adjust vocabulary and example complexity.
   - Socratic mode: after explaining, ask one follow-up question to test understanding.
   - Programming sessions: provide runnable, commented code examples.
   - Finance sessions: append a one-line risk disclaimer whenever strategy or
     investment advice is implied. Never quote live market prices.
4. After each session ends (POST /chat/sessions/:id/close), generate and store a
   3–5 sentence session summary, plus 3 suggested next questions returned to the client.
5. Include full message history in each Claude call, truncating oldest messages
   beyond ~20 turns.

Acceptance criteria:
- With a WebSocket test client (include scripts/ws-test.ts), sending a message
  streams tokens in real time and the full exchange is persisted.
- Finance answers containing advice include the disclaimer; programming answers
  include runnable code blocks.
- Free-tier user is blocked by the gateway after 5 messages in a day.
```

---

## STAGE 4 — Course & syllabus generation

```
Read CLAUDE.md. Stages 1–3 done.

Build course generation in ai-service + CRUD in course-service:

1. ai-service POST /courses/generate — input: { subjectArea, track, level, goal }.
   Output must validate against the Course Zod schema:
   - Overview: title, 3–5 learning objectives, target level, estimated duration,
     prerequisite check.
   - 4–6 modules, each with theme, key concepts, 3–5 lessons.
   - Each lesson: markdown explanation, 2–3 worked examples, 1 practice exercise,
     key takeaways.
   Use Claude with a JSON-output prompt (src/prompts/courseGen.ts); validate with
   Zod, retry once with the validation errors appended if parsing fails.
2. course-service: persistence + endpoints: POST /courses (called after generation),
   GET /courses (user's courses), GET /courses/:id (full tree),
   GET /courses/:id/lessons/:lessonId, POST /courses/:id/enroll.
3. Free tier: 1 preview course — the first module is fully readable, remaining
   modules return locked:true with an upgrade message. Pro: unlimited.
4. Seed script: generate and persist one demo course per flagship track
   (Forex Trading, Python, Cybersecurity, AI Engineering) so the app demos well.

Acceptance criteria:
- Generating "Cybersecurity, beginner, goal: become job-ready in defensive
  security" returns a schema-valid course with 4–6 modules in under 90 seconds.
- Locked-module behavior works for free users and unlocks for pro.
```

---

## STAGE 5 — Assessments: knowledge checks + module quizzes

```
Read CLAUDE.md. Stages 1–4 done.

Build assessment-service + quiz generation:

1. ai-service POST /quizzes/generate — input: { lessonId | moduleId, type:
   'knowledge_check' | 'module_quiz', userLevel }. Knowledge check: 3–5 MCQs.
   Module quiz: 10–15 questions (MCQ + short answer). Questions must be grounded
   in the stored lesson/module content (pass it into the prompt), each with
   correctAnswer and a one-line explanation. Zod-validated JSON.
2. assessment-service:
   - POST /attempts — start an attempt (enforce cool-downs: module quiz 24h after
     a fail; reject with retryAvailableAt timestamp).
   - POST /attempts/:id/submit — grade: MCQs locally; short answers graded via one
     batched Claude call with a strict rubric prompt. Store score, pass/fail
     (pass = 70%), per-question feedback.
   - GET /attempts?courseId= — history.
3. Knowledge checks are formative: ungraded, unlimited retries, free tier capped
   at 5/day via the gateway limiter.
4. Passing a module quiz emits a Redis pub/sub event `progress:module_completed`
   for progress-service to consume in Stage 6.

Acceptance criteria:
- Full flow works via requests.http: generate quiz → start attempt → submit →
  receive score + feedback.
- Failing a module quiz then immediately retrying returns the cool-down error.
```

---

## STAGE 6 — Progress service + streaks

```
Read CLAUDE.md. Stages 1–5 done.

Build progress-service:

1. Subscribe to Redis events: lesson_viewed, knowledge_check_completed,
   module_completed, chat_session_closed. Each event updates progress_records
   and the user's daily-activity log.
2. Streaks: any qualifying activity counts for the UTC day; streak resets if a
   UTC day passes with none. Store current streak + longest streak.
3. GET /dashboard — one aggregate payload for the frontend: enrolled courses with
   completion %, current streak, last 5 quiz scores, recommended next action
   (simple rule: next incomplete lesson of most recently active course).
4. GET /courses/:id/progress — per-course map of completed vs remaining lessons
   with estimated time to completion.
5. Achievement badges (computed, no cron): First Lesson, 7-Day Streak,
   First Course Completed, First Quiz Passed.

Acceptance criteria:
- Completing a lesson + quiz via the API updates the dashboard payload correctly.
- Streak math is correct across UTC boundaries (include unit tests for this).
```

---

## STAGE 7 — Frontend (React + Vite SPA)

```
Read CLAUDE.md. Backend stages 1–6 done. Build the entire MVP frontend.

Stack: React 19 + Vite + TypeScript, Zustand (client state), React Query (server
state), Socket.io-client, Tailwind. All requests go to the gateway at
VITE_API_URL; sockets to VITE_WS_URL.

Pages:
1. Landing — hero: "From Zero to Mastery. One AI tutor for Finance & Programming.",
   track showcase, pricing table (Free vs Pro $19/mo), CTA to register.
2. Auth — register/login (email + Google), onboarding: pick subject area → track →
   self-reported level → goal.
3. Course generation — form → loading state with progress copy → generated course
   overview → enroll.
4. Course detail — module accordion, lesson list with completion ticks, locked
   modules show upgrade prompt for free tier.
5. Lesson page — rendered markdown with code highlighting, worked examples,
   practice exercise, "Take knowledge check" → inline quiz UI → key takeaways →
   next lesson.
6. AI Tutor chat — session sidebar, streaming messages (token-by-token via socket),
   markdown + code rendering, suggested-question chips after each AI reply,
   free-tier message counter with upgrade prompt at 0.
7. Quiz page — MCQ + short-answer inputs, timer-free, results screen with
   per-question feedback and cool-down messaging on fail.
8. Dashboard — courses + completion %, streak flame counter, recent scores,
   badges, "continue where you left off" card.
9. Settings — profile, subscription status, upgrade/manage buttons (Stripe links
   wired in Stage 8).

Design direction: dark, focused, modern learning product (think Linear meets
Duolingo) — clean typography, one accent color per subject area (green for
finance, violet for programming), generous whitespace, zero clutter. Fully
responsive; the chat and lesson pages must be excellent on mobile web.

Acceptance criteria:
- Full journey works end-to-end against docker compose: register → onboard →
  generate course → read lesson → knowledge check → chat with tutor (streaming
  visibly) → module quiz → dashboard reflects everything.
- Free-tier limits visibly enforced in the UI with upgrade prompts.
```

---

## STAGE 8 — Stripe billing + tier enforcement

```
Read CLAUDE.md. Stages 1–7 done.

Wire up monetization:

1. In auth-service (billing module): Stripe Checkout for Pro ($19/mo),
   POST /billing/checkout-session, POST /billing/portal-session, and
   POST /billing/webhook handling checkout.session.completed,
   customer.subscription.updated, customer.subscription.deleted → update
   profiles.subscription_tier and cache tier in Redis (key tier:{userId}).
2. Gateway reads tier from Redis (fallback: DB) so limits apply instantly after
   upgrade/downgrade, no re-login needed.
3. Frontend: pricing page checkout flow, success/cancel pages, "Manage billing"
   → Stripe customer portal, and all upgrade prompts link to checkout.
4. Add webhook signature verification and idempotency (store processed event IDs).

Acceptance criteria:
- In Stripe test mode: upgrading unlocks unlimited chat/quizzes immediately;
  cancelling downgrades limits at period end.
- Webhook replay does not double-process.
```

---

## STAGE 9 — CI/CD, hardening, deploy

```
Read CLAUDE.md. Stages 1–8 done. Prepare for launch.

1. GitHub Actions: on PR → typecheck, lint, tests, docker builds; on merge to
   main → deploy (frontend to Vercel; services to Railway; Redis on Upstash;
   DB on Supabase). Provide the workflow files and a DEPLOYMENT.md runbook with
   every env var per service.
2. Hardening pass: helmet + CORS allowlist on gateway, request logging with
   request IDs propagated across services, global error handler, graceful
   shutdown, healthchecks in Dockerfiles.
3. Cost guards: per-user daily token budget in ai-service (Redis counter) with a
   soft cap even for Pro users; log Claude token usage per request for COGS
   tracking.
4. Seed a production demo account with pre-generated courses so investor demos
   never hit a cold start.
5. Final QA checklist in QA.md mapping every PRD Phase 1 requirement to where it
   is implemented, marked done/not-done. Fix anything not done.

Acceptance criteria:
- A fresh clone + the runbook produces a working production deployment.
- QA.md shows 100% of Phase 1 requirements done.
```

---

## Tips that will save you days

- **One stage per session.** Fresh Claude Code session each stage keeps context sharp; CLAUDE.md carries the constitution.
- **Verify before proceeding.** The acceptance criteria are your gate — if streaming chat (Stage 3) isn't solid, everything after it wobbles.
- **Commit per stage** with messages like `stage-3: streaming AI tutor` so you can bisect when something breaks.
- **Model string:** confirm the current Sonnet model name in the Anthropic docs when you start Stage 3 and update CLAUDE.md if needed.
- **Paystack:** the PRD is Stripe-only, but since you already have dual-currency billing designed, you can add a Stage 8b later: "Add Paystack as a second payment provider behind the same BillingProvider interface for NGN users."
