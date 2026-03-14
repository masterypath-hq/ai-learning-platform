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

## Running with Docker

**Using Supabase:** Copy `.env.example` to `.env` in the **repo root** (same folder as `docker-compose.yml`). Set `DATABASE_URL` to your Supabase **Session pooler** URI (IPv4; required for Docker):

1. Supabase Dashboard → your project → **Connect** → **Session** tab.
2. Copy the connection string (URI).
3. Paste it as `DATABASE_URL=` in `.env` (no quotes).

If you use the direct URI (`db....supabase.co`) or the wrong region, you may see `ENETUNREACH` or "Tenant or user not found".

```bash
cp .env.example .env
# Edit .env and set DATABASE_URL to the Session pooler URI from the dashboard
docker compose up -d
```

## Development

```bash
# Install dependencies (from repo root)
npm install

# Run auth service locally
npm run dev:auth
```

## Architecture

- **Microservices**: Each service is a bounded context with its own data and APIs.
- **Clean Architecture**: Services follow domain → application → infrastructure → interfaces.
- **Contracts**: APIs and events are defined in `packages/shared`; services depend on contracts, not implementations.
