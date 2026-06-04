import dns from "node:dns";
import pg from "pg";
import { PgUserRepository } from "./infrastructure/persistence/PgUserRepository.js";
import { PgPasswordResetTokenRepository } from "./infrastructure/persistence/PgPasswordResetTokenRepository.js";
import { PgRefreshTokenRepository } from "./infrastructure/persistence/PgRefreshTokenRepository.js";
import { JwtTokenService } from "./infrastructure/jwt/JwtTokenService.js";
import { SessionTokensIssuer } from "./application/services/SessionTokensIssuer.js";
import { GetMeAction } from "./application/actions/GetMeAction.js";
import { RefreshTokensAction } from "./application/actions/RefreshTokensAction.js";
import { RedisProfileCache } from "./infrastructure/cache/RedisProfileCache.js";
import { getRedisClient } from "./lib/redis.js";
import { createBearerAuthMiddleware } from "./interfaces/http/middleware/bearerAuth.js";
import { BcryptPasswordHasher } from "./infrastructure/password/BcryptPasswordHasher.js";
import { ConsoleEmailSender } from "./infrastructure/email/ConsoleEmailSender.js";
import { ResendEmailSender } from "./infrastructure/email/ResendEmailSender.js";
import { WelcomeEmailTemplate } from "./infrastructure/email/templates/WelcomeEmailTemplate.js";
import { PasswordResetEmailTemplate } from "./infrastructure/email/templates/PasswordResetEmailTemplate.js";
import { PasswordChangedEmailTemplate } from "./infrastructure/email/templates/PasswordChangedEmailTemplate.js";
import type { IEmailSender } from "./application/interfaces/IEmailSender.js";
import { createEmailQueue } from "./infrastructure/queue/EmailQueue.js";
import { createEmailWorker } from "./infrastructure/queue/EmailWorker.js";
import { QueuedEmailSender } from "./infrastructure/queue/QueuedEmailSender.js";
import { InMemoryEventPublisher } from "./infrastructure/events/InMemoryEventPublisher.js";
import { SignUpAction } from "./application/actions/SignUpAction.js";
import { SignInAction } from "./application/actions/SignInAction.js";
import { GoogleSignInAction } from "./application/actions/GoogleSignInAction.js";
import { GithubSignInAction } from "./application/actions/GithubSignInAction.js";
import { ForgotPasswordAction } from "./application/actions/ForgotPasswordAction.js";
import { ResetPasswordAction } from "./application/actions/ResetPasswordAction.js";
import { GoogleAuthProvider } from "./infrastructure/google/GoogleAuthProvider.js";
import { RedisGoogleStateStore } from "./infrastructure/google/RedisGoogleStateStore.js";
import { RedisGoogleCallbackStore } from "./infrastructure/google/RedisGoogleCallbackStore.js";
import { GithubAuthProvider } from "./infrastructure/github/GithubAuthProvider.js";
import { RedisGithubStateStore } from "./infrastructure/github/RedisGithubStateStore.js";
import { RedisGithubCallbackStore } from "./infrastructure/github/RedisGithubCallbackStore.js";
import { AuthService } from "./application/services/AuthService.js";
import { AuthController } from "./interfaces/http/controllers/AuthController.js";
import { AuthResource } from "./interfaces/http/resources/AuthResource.js";
import { App } from "./interfaces/http/app.js";

const DEFAULT_DATABASE_URL = "postgresql://auth:auth@localhost:5432/auth";

function normalizeConnectionString(value: string): string {
  let s = value.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  return s.trim();
}

/**
 * Parse postgresql:// or postgres:// URL without using URL() so passwords
 * containing @, :, #, etc. work (no URL-encoding required).
 */
function parseConnectionString(connectionString: string): pg.PoolConfig {
  const withoutProtocol = connectionString.replace(/^\s*postgres(ql)?:\/\//i, "").trim();
  const atIndex = withoutProtocol.lastIndexOf("@");
  if (atIndex === -1) {
    return { connectionString };
  }
  const userPass = withoutProtocol.slice(0, atIndex);
  const hostPortDb = withoutProtocol.slice(atIndex + 1);
  const colonIndex = userPass.indexOf(":");
  const user = colonIndex === -1 ? userPass : userPass.slice(0, colonIndex);
  const password = colonIndex === -1 ? undefined : userPass.slice(colonIndex + 1);
  const slashIndex = hostPortDb.indexOf("/");
  const database = slashIndex === -1 ? "postgres" : hostPortDb.slice(slashIndex + 1).replace(/\?.*$/, "");
  const hostPort = slashIndex === -1 ? hostPortDb : hostPortDb.slice(0, slashIndex);
  const lastColon = hostPort.lastIndexOf(":");
  const host = lastColon === -1 ? hostPort : hostPort.slice(0, lastColon);
  const port = lastColon === -1 ? 5432 : parseInt(hostPort.slice(lastColon + 1), 10) || 5432;
  const ssl =
    host !== "localhost" && !host.startsWith("127.")
      ? { rejectUnauthorized: false, servername: host }
      : false;
  return { user, password, host, port, database, ssl };
}

/** Use IPv4 when available so Docker (often without IPv6) can connect. Skip for pooler — use hostname as-is so tenant routing works. */
async function resolveHostToIPv4(host: string): Promise<string> {
  if (host === "localhost" || host.startsWith("127.")) return host;
  if (host.includes("pooler.supabase.com")) return host;
  try {
    const addresses = await dns.promises.resolve4(host);
    return addresses[0] ?? host;
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? (err as NodeJS.ErrnoException).code : "";
    if (code === "ENODATA" || code === "ENOTFOUND") {
      console.warn(
        `[auth-service] Host "${host}" has no IPv4 record. In Docker you may get ENETUNREACH. Use Supabase's pooler connection string (Project Settings → Database → Connection pooling) which usually has IPv4.`
      );
      return host;
    }
    throw err;
  }
}

export async function createCompositionRoot() {
  const raw = process.env.DATABASE_URL;
  const connectionString =
    raw && raw.trim() !== ""
      ? normalizeConnectionString(raw)
      : DEFAULT_DATABASE_URL;

  if (!raw || raw.trim() === "") {
    console.error(
      "DATABASE_URL is not set. Put DATABASE_URL in .env in the same folder as docker-compose.yml and run 'docker compose up' from that folder."
    );
  }

  const isPooler = connectionString.includes("pooler.supabase.com");
  let pool: pg.Pool;

  if (isPooler) {
    const poolConfig = parseConnectionString(connectionString.replace(/\?.*$/, ""));
    console.log(`[auth-service] Using Supabase pooler (parsed connection; supports @ in password)`);
    pool = new pg.Pool({
      user: poolConfig.user,
      password: poolConfig.password,
      host: poolConfig.host,
      port: poolConfig.port,
      database: poolConfig.database,
      ssl: { rejectUnauthorized: false, servername: poolConfig.host as string },
    });
  } else {
    const poolConfig = parseConnectionString(connectionString);
    if (poolConfig.host) {
      poolConfig.host = await resolveHostToIPv4(poolConfig.host);
    }
    pool = new pg.Pool(poolConfig);
  }

  pool.query("SELECT 1").catch((err: Error) =>
    console.warn("[auth-service] DB warmup query failed:", err.message)
  );

  const userRepo = new PgUserRepository(pool);
  const resetTokenRepo = new PgPasswordResetTokenRepository(pool);
  const refreshTokenRepo = new PgRefreshTokenRepository(pool);
  const jwtSecret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
  const tokenService = new JwtTokenService(jwtSecret);
  const sessionTokensIssuer = new SessionTokensIssuer(tokenService, refreshTokenRepo);

  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) {
    console.error(
      "[auth-service] REDIS_URL is not set. GET /me and profile caching require Redis. Set REDIS_URL (e.g. redis://localhost:6379)."
    );
  }
  const redis = redisUrl ? getRedisClient(redisUrl) : null;
  const profileCache = redis ? new RedisProfileCache(redis) : null;
  if (!profileCache) {
    throw new Error("REDIS_URL is required for auth-service (profile cache).");
  }

  const getMeAction = new GetMeAction(userRepo, profileCache);
  const refreshTokensAction = new RefreshTokensAction(userRepo, refreshTokenRepo, sessionTokensIssuer);
  const bearerAuth = createBearerAuthMiddleware(tokenService);
  const passwordHasher = new BcryptPasswordHasher();
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM_ADDRESS ?? "onboarding@resend.dev";
  const directEmailSender: IEmailSender = resendApiKey
    ? new ResendEmailSender(
        resendApiKey,
        resendFrom,
        new WelcomeEmailTemplate(),
        new PasswordResetEmailTemplate(),
        new PasswordChangedEmailTemplate()
      )
    : new ConsoleEmailSender();
  if (resendApiKey) {
    console.log(`[auth-service] Email via Resend (from: ${resendFrom})`);
  } else {
    console.log("[auth-service] RESEND_API_KEY not set — emails logged to console");
  }

  const emailQueue = createEmailQueue(redisUrl!);
  const emailWorker = createEmailWorker(redisUrl!, directEmailSender);
  const emailSender: IEmailSender = new QueuedEmailSender(emailQueue);
  console.log("[auth-service] Email queue ready (BullMQ)");

  const eventPublisher = new InMemoryEventPublisher();

  const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  const googleRedirectUri =
    process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3001/api/v1/auth/google/callback";
  const googleRedirectFrontendUrl =
    process.env.GOOGLE_REDIRECT_FRONTEND_URL ?? "http://localhost:3000/auth/callback";

  const googleAuthProvider = new GoogleAuthProvider(
    googleClientId,
    googleClientSecret,
    googleRedirectUri
  );

  if (googleClientId) {
    console.log("[auth-service] Google OAuth configured");
  } else {
    console.log("[auth-service] GOOGLE_CLIENT_ID not set — Google sign-in disabled");
  }

  const signUpAction = new SignUpAction(
    userRepo,
    passwordHasher,
    sessionTokensIssuer,
    emailSender,
    eventPublisher
  );
  const signInAction = new SignInAction(userRepo, passwordHasher, sessionTokensIssuer);
  const googleSignInAction = new GoogleSignInAction(
    userRepo,
    sessionTokensIssuer,
    googleAuthProvider,
    emailSender,
    eventPublisher
  );
  const forgotPasswordAction = new ForgotPasswordAction(
    userRepo,
    resetTokenRepo,
    emailSender,
    eventPublisher
  );
  const resetPasswordAction = new ResetPasswordAction(
    userRepo,
    resetTokenRepo,
    passwordHasher,
    emailSender,
    eventPublisher
  );

  const googleStateStore = new RedisGoogleStateStore(redis!);
  const googleCallbackStore = new RedisGoogleCallbackStore(redis!);

  const githubClientId = process.env.GITHUB_CLIENT_ID ?? "";
  const githubClientSecret = process.env.GITHUB_CLIENT_SECRET ?? "";
  const githubRedirectUri =
    process.env.GITHUB_REDIRECT_URI ?? "http://localhost:3001/api/v1/auth/github/callback";

  const githubAuthProvider = new GithubAuthProvider(
    githubClientId,
    githubClientSecret,
    githubRedirectUri
  );
  const githubSignInAction = new GithubSignInAction(
    userRepo,
    sessionTokensIssuer,
    githubAuthProvider,
    emailSender,
    eventPublisher
  );
  const githubStateStore = new RedisGithubStateStore(redis!);
  const githubCallbackStore = new RedisGithubCallbackStore(redis!);

  if (githubClientId) {
    console.log("[auth-service] GitHub OAuth configured");
  } else {
    console.log("[auth-service] GITHUB_CLIENT_ID not set — GitHub sign-in disabled");
  }

  const authService = new AuthService(
    signUpAction,
    signInAction,
    googleSignInAction,
    githubSignInAction,
    forgotPasswordAction,
    resetPasswordAction,
    getMeAction,
    refreshTokensAction,
    googleAuthProvider,
    googleStateStore,
    googleCallbackStore,
    githubAuthProvider,
    githubStateStore,
    githubCallbackStore
  );
  const authController = new AuthController(authService, googleRedirectFrontendUrl);
  const app = new App(authController, bearerAuth);

  return { app, pool, emailWorker, emailQueue };
}
