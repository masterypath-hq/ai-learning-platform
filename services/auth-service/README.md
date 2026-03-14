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

Create a `.env` from `.env.example`. Summary:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes (unless local DB) | `postgresql://auth:auth@localhost:5432/auth` | Postgres connection string (Supabase or local) |
| `JWT_SECRET` | Yes in production | `dev-secret-change-in-production` | Secret used to sign JWTs; use a long random value in prod |
| `RESET_LINK_BASE_URL` | No | From request `Host` | Base URL for “Reset password” links in emails (e.g. `https://app.example.com`) |
| `PORT` | No | `3001` | Port the HTTP server listens on |

## Database: Supabase (Postgres)

The auth service uses **Supabase** as its database (standard Postgres). No code changes are required: set `DATABASE_URL` to your Supabase connection string.

### First-time setup: create tables (run once)

There is no migration runner. The **user table** (and `password_reset_tokens`) are created by running the schema once:

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
2. Copy the full contents of **`services/auth-service/schema.sql`** (in this repo).
3. Paste into the SQL Editor and click **Run**.

That creates:

- **`users`** — `id`, `email`, `password_hash`, `name`, `created_at`, `email_verified_at`
- **`password_reset_tokens`** — for forgot-password flow

After that, the auth service can sign up and sign in users. You only need to run it once per database.

### Connection string

1. In **Project Settings** → **Database** (or **Connect**), copy the **Session pooler** URI for Docker (IPv4).
2. Set `DATABASE_URL` in `.env` (repo root for Docker).
3. Set `DATABASE_URL` to that URI (e.g. in `.env` or your runtime env).

The service uses the `pg` driver and works with any Postgres-compatible host, including Supabase.

## Local development

**Option A — Supabase (recommended)**  
1. Create a Supabase project and run `schema.sql` in the SQL Editor (see above).  
2. Set `DATABASE_URL` to your Supabase connection string.  
3. From repo root: `npm run dev:auth`

**Option B — Local Postgres (Docker)**  
1. `docker compose --profile local up -d` (starts `auth-db` + `auth-service`).  
2. Schema is applied automatically to the local DB.

**Option C — Local Postgres (manual)**  
1. Start Postgres, create a database, then run `psql $DATABASE_URL -f services/auth-service/schema.sql`.  
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
