import "dotenv/config";
import express from "express";
import { loadConfig } from "./config/env.js";
import { getRedisClient, disconnectRedis } from "./lib/redis.js";
import { createVerifyJwt } from "./middleware/verifyJwt.js";
import { createChatRateLimit } from "./middleware/chatRateLimit.js";
import { createSignInRateLimit } from "./middleware/signInRateLimit.js";
import { createServiceProxy } from "./proxy/createServiceProxy.js";

const config = loadConfig();
const redis = getRedisClient(config.redisUrl);

const verifyJwt = createVerifyJwt(config.jwtSecret);
const chatRateLimit = createChatRateLimit({
  redis,
  dailyLimit: config.freeTierDailyLimit,
});
const signInRateLimit = createSignInRateLimit({
  redis,
  maxAttempts: config.signInMaxAttempts,
  windowSeconds: config.signInWindowSeconds,
});

const app = express();

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "gateway" });
});

/**
 * Email links use `RESET_LINK_BASE_URL` + `/reset-password?token=…` (often `http://localhost:4000`).
 * This redirects to the SPA so the token is not tied to a raw API host in the email.
 */
app.get("/reset-password", (req, res) => {
  const token = req.query.token;
  if (typeof token !== "string" || token.length === 0) {
    res.status(400).json({ error: "Missing token query parameter" });
    return;
  }
  const path = config.frontendResetPasswordPath.startsWith("/")
    ? config.frontendResetPasswordPath
    : `/${config.frontendResetPasswordPath}`;
  const target = `${config.frontendUrl}${path}?token=${encodeURIComponent(token)}`;
  res.redirect(302, target);
});

// ── Public auth routes (no JWT required) ──────────────────────────
const authProxy = createServiceProxy({
  target: config.services.auth,
  timeoutMs: config.proxyTimeoutMs,
});
/** Same upstream paths as auth service (`/api/v1/auth/...`) — for clients that include `/v1`. */
const authProxyV1 = createServiceProxy({
  target: config.services.authV1,
  timeoutMs: config.proxyTimeoutMs,
});

const protectedAuthProxy = createServiceProxy({
  target: config.services.auth,
  timeoutMs: config.proxyTimeoutMs,
});
const protectedAuthProxyV1 = createServiceProxy({
  target: config.services.authV1,
  timeoutMs: config.proxyTimeoutMs,
});

app.post("/api/auth/sign-in", signInRateLimit, authProxy);
app.post("/api/auth/sign-up", authProxy);
app.post("/api/auth/refresh", authProxy);
app.post("/api/auth/forgot-password", authProxy);
app.post("/api/auth/reset-password", authProxy);
app.get("/api/auth/google", authProxy);
app.get("/api/auth/google/callback", authProxy);
app.post("/api/auth/google/exchange", authProxy);
app.get("/api/auth/github", authProxy);
app.get("/api/auth/github/callback", authProxy);
app.post("/api/auth/github/exchange", authProxy);

app.post("/api/v1/auth/sign-in", signInRateLimit, authProxyV1);
app.post("/api/v1/auth/sign-up", authProxyV1);
app.post("/api/v1/auth/refresh", authProxyV1);
app.post("/api/v1/auth/forgot-password", authProxyV1);
app.post("/api/v1/auth/reset-password", authProxyV1);
app.get("/api/v1/auth/google", authProxyV1);
app.get("/api/v1/auth/google/callback", authProxyV1);
app.post("/api/v1/auth/google/exchange", authProxyV1);
app.get("/api/v1/auth/github", authProxyV1);
app.get("/api/v1/auth/github/callback", authProxyV1);
app.post("/api/v1/auth/github/exchange", authProxyV1);

// ── Protected auth (JWT) — must come after explicit public routes above ──
app.use("/api/auth", verifyJwt, protectedAuthProxy);
app.use("/api/v1/auth", verifyJwt, protectedAuthProxyV1);

app.use(
  "/api/ai",
  verifyJwt,
  chatRateLimit,
  createServiceProxy({ target: config.services.ai, timeoutMs: config.proxyTimeoutMs }),
);

app.use(
  "/api/courses",
  verifyJwt,
  createServiceProxy({ target: config.services.course, timeoutMs: config.proxyTimeoutMs }),
);

app.use(
  "/api/progress",
  verifyJwt,
  createServiceProxy({ target: config.services.progress, timeoutMs: config.proxyTimeoutMs }),
);

// ── 404 catch-all ────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const server = app.listen(config.port, () => {
  console.log(`[gateway] Listening on port ${config.port}`);
});

async function shutdown() {
  console.log("[gateway] Shutting down…");
  server.close();
  await disconnectRedis();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
