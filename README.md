# AI Learning Platform

Monorepo for the AI-powered learning platform. See [PRD](docs/PRD.md) for product requirements.

## Structure

- **frontend/** — Next.js web app (separate ownership)
- **services/** — Backend microservices
- **packages/shared/** — Shared contracts, types, and utilities

## Services

| Service | Description |
|--------|-------------|
| auth  | User authentication: sign up, sign in, forgot password, welcome email |
| gateway | API gateway (routing, auth proxy) |
| course | Course and lesson APIs |

## Development

```bash
# Install dependencies (from repo root)
npm install

# Run services locally
npm run dev:auth
npm run dev:gateway
npm run dev:course
```

## Running with Docker

**Using Supabase:** Copy `.env.example` to `.env` in the **repo root** (same folder as `docker-compose.yml`). Set `DATABASE_URL` to your Supabase **Session pooler** URI (IPv4; required for Docker):

1. Supabase Dashboard → your project → **Connect** → **Session** tab.
2. Copy the connection string (URI).
3. Paste it as `DATABASE_URL=` in `.env` (no quotes).

If you use the direct URI (`db....supabase.co`) or the wrong region, you may see `ENETUNREACH` or "Tenant or user not found".

```bash
cp .env.example .env
docker compose up -d
```

## CI/CD (GitHub Actions)

### Workflow

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | PR → `dev` or `main` | Lint, typecheck, tests (path-filtered) |
| [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) | Push → `main` | Deploy to Railway / Vercel |

**Branch flow:** Open PRs into `dev` → merge when `ci-gate` passes → merge `dev` into `main` yourself → push to `main` deploys.

### Local CI commands

```bash
npm run lint:services
npm run test:services
npm run lint -w @ai-learning-platform/frontend
npm run typecheck -w @ai-learning-platform/frontend
```

After changing dependencies, run `npm install` at the repo root and commit `package-lock.json`.

### Branch protection

**Settings → Branches → Add rule**

**`dev` and `main`:**

- Require a pull request before merging
- Require status checks to pass → select **`ci-gate`** (appears after the first PR workflow run)
- Require branches to be up to date before merging (recommended)
- Do not allow bypassing the above settings

Only **`ci-gate`** is required (not the individual lint/test jobs), so path-filtered skips do not block merges.

### GitHub Actions secrets

| Secret | Required for | Where to get it |
|--------|----------------|-----------------|
| `RAILWAY_TOKEN` | Backend (+ optional frontend) deploy | Railway → Account Settings → Tokens |
| `RAILWAY_SERVICE_ID_AUTH` | auth-service deploy | Railway service → Settings → Service ID |
| `RAILWAY_SERVICE_ID_GATEWAY` | gateway deploy | Same |
| `RAILWAY_SERVICE_ID_COURSE` | course-service deploy | Same |
| `RAILWAY_FRONTEND_SERVICE_ID` | Frontend on Railway (if not using Vercel) | Same |
| `VERCEL_TOKEN` | Frontend on Vercel (preferred when set) | Vercel → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel deploy | Project settings or `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Vercel deploy | Same |

**CI needs no secrets.**

Frontend deploy: if `VERCEL_TOKEN` is set, Vercel is used; otherwise Railway when `RAILWAY_FRONTEND_SERVICE_ID` is set.

Configure each Railway service with Dockerfile `services/<name>/Dockerfile` and build context = repo root.

## Architecture

- **Microservices**: Each service is a bounded context with its own data and APIs.
- **Clean Architecture**: Services follow domain → application → infrastructure → interfaces.
- **Contracts**: APIs and events are defined in `packages/shared`; services depend on contracts, not implementations.
