import Stripe from "stripe";
import { createPgPool } from "@ai-learning-platform/shared";
import type { SubscriptionProvider } from "@ai-learning-platform/shared";
import { PgUserRepository } from "./infrastructure/persistence/PgUserRepository.js";
import { PgWaitlistRepository } from "./infrastructure/persistence/PgWaitlistRepository.js";
import { PgSubscriptionRepository } from "./infrastructure/persistence/PgSubscriptionRepository.js";
import { PgProcessedWebhookEventRepository } from "./infrastructure/persistence/PgProcessedWebhookEventRepository.js";
import { RedisTierCache } from "./infrastructure/cache/RedisTierCache.js";
import { StripeBillingProvider } from "./infrastructure/billing/StripeBillingProvider.js";
import { PaystackBillingProvider } from "./infrastructure/billing/PaystackBillingProvider.js";
import type { IBillingProvider } from "./application/interfaces/IBillingProvider.js";
import { CreateCheckoutSessionAction } from "./application/actions/CreateCheckoutSessionAction.js";
import { CreatePortalSessionAction } from "./application/actions/CreatePortalSessionAction.js";
import { CancelSubscriptionAction } from "./application/actions/CancelSubscriptionAction.js";
import { HandleWebhookAction } from "./application/actions/HandleWebhookAction.js";
import { GetSubscriptionStatusAction } from "./application/actions/GetSubscriptionStatusAction.js";
import { BillingController } from "./interfaces/http/controllers/BillingController.js";
import { JoinWaitlistAction } from "./application/actions/JoinWaitlistAction.js";
import { WaitlistController } from "./interfaces/http/controllers/WaitlistController.js";
import { PgPasswordResetTokenRepository } from "./infrastructure/persistence/PgPasswordResetTokenRepository.js";
import { PgRefreshTokenRepository } from "./infrastructure/persistence/PgRefreshTokenRepository.js";
import { JwtTokenService } from "./infrastructure/jwt/JwtTokenService.js";
import { SessionTokensIssuer } from "./application/services/SessionTokensIssuer.js";
import { GetMeAction } from "./application/actions/GetMeAction.js";
import { PatchMeAction } from "./application/actions/PatchMeAction.js";
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

export async function createCompositionRoot() {
  const raw = process.env.DATABASE_URL;
  const connectionString = raw && raw.trim() !== "" ? raw : DEFAULT_DATABASE_URL;

  if (!raw || raw.trim() === "") {
    console.error(
      "DATABASE_URL is not set. Put DATABASE_URL in .env in the same folder as docker-compose.yml and run 'docker compose up' from that folder."
    );
  }

  const pool = await createPgPool("auth-service", connectionString);

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

  // ── Billing (Stripe + Paystack) ──────────────────────────────────
  const subscriptionRepo = new PgSubscriptionRepository(pool);
  const processedWebhookEventRepo = new PgProcessedWebhookEventRepository(pool);
  const tierCache = new RedisTierCache(redis!);

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? "";
  // Stripe's SDK throws synchronously on a falsy key — fall back to a placeholder so
  // composition (and `docker compose up`) still succeeds when billing isn't configured
  // yet, same as the Google/GitHub OAuth providers below. Real calls fail at request time.
  const stripe = new Stripe(stripeSecretKey || "sk_test_not_configured");
  const stripeProvider = new StripeBillingProvider(
    stripe,
    process.env.STRIPE_PRICE_ID_PRO ?? "",
    process.env.STRIPE_WEBHOOK_SECRET ?? ""
  );
  if (!stripeSecretKey) {
    console.log("[auth-service] STRIPE_SECRET_KEY not set — Stripe checkout will fail until configured");
  }

  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY ?? "";
  const paystackProvider = new PaystackBillingProvider(
    paystackSecretKey,
    process.env.PAYSTACK_PLAN_CODE ?? "",
    process.env.BILLING_SUCCESS_URL ?? "http://localhost:3000/billing/success"
  );
  if (!paystackSecretKey) {
    console.log("[auth-service] PAYSTACK_SECRET_KEY not set — Paystack checkout will fail until configured");
  }

  const billingProviders: Record<SubscriptionProvider, IBillingProvider> = {
    stripe: stripeProvider,
    paystack: paystackProvider,
  };

  const billingSuccessUrl = process.env.BILLING_SUCCESS_URL ?? "http://localhost:3000/billing/success";
  const billingCancelUrl = process.env.BILLING_CANCEL_URL ?? "http://localhost:3000/billing/cancel";
  const billingPortalReturnUrl = process.env.BILLING_PORTAL_RETURN_URL ?? "http://localhost:3000/settings";

  const createCheckoutSessionAction = new CreateCheckoutSessionAction(billingProviders, billingSuccessUrl, billingCancelUrl);
  const createPortalSessionAction = new CreatePortalSessionAction(subscriptionRepo, stripeProvider, billingPortalReturnUrl);
  const cancelSubscriptionAction = new CancelSubscriptionAction(subscriptionRepo, paystackProvider, tierCache);
  const handleWebhookAction = new HandleWebhookAction(
    billingProviders,
    subscriptionRepo,
    processedWebhookEventRepo,
    userRepo,
    profileCache,
    tierCache
  );
  const getSubscriptionStatusAction = new GetSubscriptionStatusAction(subscriptionRepo, userRepo);
  const billingController = new BillingController(
    createCheckoutSessionAction,
    createPortalSessionAction,
    cancelSubscriptionAction,
    handleWebhookAction,
    getSubscriptionStatusAction
  );

  const getMeAction = new GetMeAction(userRepo, profileCache, subscriptionRepo, tierCache);
  const patchMeAction = new PatchMeAction(userRepo, profileCache);
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
    patchMeAction,
    refreshTokensAction,
    googleAuthProvider,
    googleStateStore,
    googleCallbackStore,
    githubAuthProvider,
    githubStateStore,
    githubCallbackStore
  );
  const authController = new AuthController(authService, googleRedirectFrontendUrl);

  const waitlistRepo = new PgWaitlistRepository(pool);
  const joinWaitlistAction = new JoinWaitlistAction(waitlistRepo);
  const waitlistController = new WaitlistController(joinWaitlistAction);

  const app = new App(authController, bearerAuth, waitlistController, billingController);

  return { app, pool, emailWorker, emailQueue };
}
