# Auth Service

Microservice for user authentication: sign up, sign in, forgot password, reset password, and welcome email.

## Architecture (OOP + SOLID + Microservices)

**Flow:** Controller → Request → Service → Actions → Interfaces (ports) / Models. Resources register routes and bind the controller.

| Layer | Role | Location |
|-------|------|----------|
| **Controller** | HTTP handling only; builds Request, calls Service, sends response | `interfaces/http/controllers/` |
| **Request** | OOP request objects; validate and parse body (`fromBody`) | `interfaces/http/request/` |
| **Resources** | Register routes and bind controller (one resource per API area) | `interfaces/http/resources/` |
| **Models** | Domain entities; no framework or DB | `domain/models/` |
| **Actions** | One class per operation (sign-up, sign-in, etc.); single responsibility | `application/actions/` |
| **Interfaces** | Ports (abstractions); dependency inversion, interface segregation | `application/interfaces/` |
| **Service** | Application facade; delegates to Actions | `application/services/` |

- **Infrastructure** implements `application/interfaces` (e.g. `PgUserRepository`, `JwtTokenService`). Bounded context: auth owns its data and APIs only.
- **Contracts**: Request/response and events live in `@ai-learning-platform/shared`.

### SOLID alignment

| Principle | How it's applied |
|-----------|------------------|
| **S** (Single responsibility) | One class, one reason to change: controller = HTTP only; each action = one operation; request classes = parse/validate only. |
| **O** (Open/closed) | New behaviour via new actions/adapters (e.g. `RefreshTokenAction`, `SmtpEmailSender`) without modifying existing classes. |
| **L** (Liskov substitution) | Any implementation of `IUserRepository`, `IAuthService`, etc. can replace another (e.g. in-memory repos in tests). |
| **I** (Interface segregation) | Small, role-specific interfaces: `IWelcomeEmailSender` / `IPasswordResetEmailSender` (not one fat `IEmailSender` for callers); `ISignUpAction`, `ISignInAction`, etc. |
| **D** (Dependency inversion) | Controller depends on `IAuthService`; `AuthService` depends on `ISignUpAction`, `ISignInAction`, etc.; actions depend on repository/email/token interfaces. Concretions are wired only in the composition root. |

## API (v1) & Postman

**Postman:** Import `postman/AI-Learning-Platform-Auth-API.postman_collection.json`; see `postman/README.md` for usage.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/sign-up` | Register; returns tokens; sends welcome email |
| POST | `/api/v1/auth/sign-in` | Login; returns access token |
| POST | `/api/v1/auth/forgot-password` | Send reset link to email |
| POST | `/api/v1/auth/reset-password` | Set new password with token from email |
| GET | `/health` | Health check |

## Environment variables

Create a `.env` from the repo root [`.env.example`](../../.env.example). Full reference: [root README — Environment variables](../../README.md#environment-variables).

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes (unless local DB) | `postgresql://auth:auth@localhost:5432/auth` | Postgres (Supabase Session pooler recommended) |
| `JWT_SECRET` | Yes in production | `dev-secret-change-in-production` | Signs JWTs; gateway must use the same value |
| `REDIS_URL` | **Yes** | — | Profile cache, OAuth state, **BullMQ email queue**; service fails without it |
| `RESEND_API_KEY` | No | — | Resend API; without it emails log to console |
| `RESEND_FROM_ADDRESS` | No | `onboarding@resend.dev` | Verified sender in Resend |
| `RESET_LINK_BASE_URL` | No | From request `Host` | Password-reset link base (gateway URL in Docker) |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth; disabled if empty |
| `GOOGLE_CLIENT_SECRET` | No | — | Google OAuth secret |
| `GOOGLE_REDIRECT_URI` | No | localhost callback | Auth-service Google callback |
| `GOOGLE_REDIRECT_FRONTEND_URL` | No | `http://localhost:3000/auth/callback` | Frontend after Google OAuth |
| `GITHUB_CLIENT_ID` | No | — | GitHub OAuth; disabled if empty |
| `GITHUB_CLIENT_SECRET` | No | — | GitHub OAuth secret |
| `GITHUB_REDIRECT_URI` | No | localhost callback | Auth-service GitHub callback |
| `PORT` | No | `3001` | HTTP listen port |

### Redis

`REDIS_URL` is required. Locally: `redis://localhost:6379` after `npm run dev:redis`. Docker: `redis://redis:6379` (set by compose). Production: Render Redis or Upstash URL.

### Render deploy checklist

- [ ] **Redis add-on** created; `REDIS_URL` set on the service
- [ ] `DATABASE_URL` — Supabase **Session pooler** URI
- [ ] `JWT_SECRET` — long random string
- [ ] `RESEND_API_KEY` and `RESEND_FROM_ADDRESS` for real emails
- [ ] OAuth redirect URIs match production URLs
- [ ] Migrations applied: `npm run migrate:auth` (against prod DB from your machine or CI)
- [ ] Logs show `Email queue ready (BullMQ)` after deploy

## Database: Supabase (Postgres)

The auth service uses **Supabase** (or any Postgres). Set **`DATABASE_URL`** in the repo root `.env`.

### Migrations (tracked, repeatable)

We use **[node-pg-migrate](https://github.com/salsita/node-pg-migrate)**. Applied migrations are recorded in the **`pgmigrations`** table.

From the **repo root** (loads `.env` via `--envPath`):

```bash
# Apply pending migrations
npm run migrate:auth

# Or from the auth-service workspace
cd services/auth-service && npm run migrate:up
```

**`DATABASE_URL`** must be set (see below).

| Script | Purpose |
|--------|---------|
| `npm run migrate:up` | Run all pending migrations (default: single transaction) |
| `npm run migrate:down` | Revert one migration (initial migration has no safe `down`) |
| `npm run migrate:create -- my_change` | Create `db/migrations/<timestamp>_my_change.js` (run from `services/auth-service`) |
| `npm run migrate:fake` | Mark pending migrations as applied **without** running SQL (use once if the DB already matches the schema) |

Migration files live in **`services/auth-service/db/migrations/`**. Legacy SQL snapshots are in **`migrations/archive/`** (historical only).

**Dry run (prints SQL only):**

```bash
cd services/auth-service && npx node-pg-migrate up --dry-run --migrations-dir db/migrations --envPath ../../.env
```

### Connection string

1. In **Project Settings** → **Database** (or **Connect**), copy the **Session pooler** URI for Docker (IPv4).
2. Set `DATABASE_URL` in `.env` (repo root for Docker).
3. Set `DATABASE_URL` to that URI (e.g. in `.env` or your runtime env).

The service uses the `pg` driver and works with any Postgres-compatible host, including Supabase.

## Local development

**Option A — Supabase (recommended)**  
1. Create a Supabase project and set `DATABASE_URL` in `.env`.  
2. Run **`npm run migrate:auth`** from the repo root.  
3. `npm run dev:auth`

**Option B — Local Postgres (Docker)**  
1. `docker compose --profile local up -d` (starts `auth-db` + `auth-service`).  
2. Schema is applied automatically from `schema.sql` on first container init.  
3. To use the same migration runner against that DB: `DATABASE_URL=postgresql://auth:auth@localhost:5433/auth npm run migrate:auth` (port **5433** maps to the container in `docker-compose.yml`).

**Option C — Local Postgres (manual)**  
1. Start Postgres, create a database, then run **`npm run migrate:auth`** with `DATABASE_URL` set, or `psql $DATABASE_URL -f services/auth-service/schema.sql`.  
2. `npm run dev:auth` with `DATABASE_URL` set.

Env: `DATABASE_URL` (required for Supabase or remote Postgres), `JWT_SECRET`, `PORT` (default 3001), `RESET_LINK_BASE_URL`.

## Docker

From repo root:

```bash
docker compose up -d
```

- **auth-db**: Local Postgres 16; schema applied on first start. Omit this when using Supabase by setting `DATABASE_URL` and running only the auth-service (e.g. `docker compose run --rm -p 3001:3001 -e DATABASE_URL=... auth-service`).
- **auth-service**: Listens on 3001; uses `DATABASE_URL`, `JWT_SECRET`, `RESET_LINK_BASE_URL`.

## Troubleshooting

### "Tenant or user not found" (Supabase pooler)

This means the **pooler host in your connection string does not match your project’s region**. Supabase uses different pooler hosts per region (e.g. `aws-0-us-east-1`, `aws-0-eu-west-1`, or **`aws-1-us-east-2`** — note `aws-1` not `aws-0` in some regions). You must use the **exact** URI from the dashboard:

1. **Supabase Dashboard** → your project → click **Connect** (top of sidebar or in Database).
2. Open the **Session** tab (not Direct or Transaction).
3. Copy the **entire** connection string (URI). Do not change the host or username.
4. In the **repo root** `.env`, set:  
   `DATABASE_URL=<paste that full URI here>`  
   (no quotes, one line.)
5. Rebuild and restart:  
   `docker compose build auth-service && docker compose up -d --force-recreate`.

If you still see the error, run the auth service **locally** (no Docker) with the same `.env`: from repo root run `npm run dev:auth` and try sign-up. If it works locally, the URI is correct and the issue is Docker/network; if it fails locally too, the URI is still wrong — double-check the Session URI in the dashboard.

## Events (choreography)

- `auth.user.registered.v1` — after sign up (welcome email sent by this service).
- `auth.password_reset.requested.v1` — reset link requested.
- `auth.password_reset.completed.v1` — password reset completed.

Other services can subscribe to these (e.g. via RabbitMQ/Kafka) when a message broker is added.
