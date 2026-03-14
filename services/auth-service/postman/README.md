# Postman — Auth API

## Import the collection

1. Open Postman.
2. **Import** → **File** → choose `AI-Learning-Platform-Auth-API.postman_collection.json`.
3. The collection **AI Learning Platform — Auth API** will appear in your sidebar.

## Variables

| Variable      | Default                 | Description                    |
|---------------|-------------------------|--------------------------------|
| `baseUrl`     | `http://localhost:3001` | Auth service base URL          |
| `accessToken` | (empty)                 | Optional; for future use (e.g. protected routes) |

Edit at collection level: select the collection → **Variables** tab.

## Endpoints

| Method | Path                         | Description        |
|--------|------------------------------|--------------------|
| GET    | `/health`                    | Health check       |
| POST   | `/api/v1/auth/sign-up`       | Register           |
| POST   | `/api/v1/auth/sign-in`       | Sign in            |
| POST   | `/api/v1/auth/forgot-password` | Request reset link |
| POST   | `/api/v1/auth/reset-password`  | Set new password   |

## Quick test flow

1. **Health** — confirm the service is up.
2. **Sign up** — use a new email; copy `accessToken` from the response if you need it later.
3. **Sign in** — same email/password; get a fresh token.
4. **Forgot password** — use the same email; in dev the reset link is logged to the server console.
5. **Reset password** — paste the token from the log (or email) and set a new password.

Ensure the auth service is running (`npm run dev:auth` from repo root or via Docker) and `baseUrl` points to it.
