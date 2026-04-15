export interface ServiceTarget {
  url: string;
  pathRewrite: Record<string, string>;
}

export interface GatewayConfig {
  port: number;
  jwtSecret: string;
  redisUrl: string;
  freeTierDailyLimit: number;
  proxyTimeoutMs: number;
  /** Where to send users after they open the email link (SPA reset-password page). */
  frontendUrl: string;
  /** Path on the frontend for the reset form (default `/reset-password`). */
  frontendResetPasswordPath: string;
  services: {
    /** Client path `/api/auth/*` → upstream `/api/v1/auth/*` */
    auth: ServiceTarget;
    /** Client path already `/api/v1/auth/*` — forward as-is to auth service */
    authV1: ServiceTarget;
    ai: ServiceTarget;
    course: ServiceTarget;
    progress: ServiceTarget;
  };
}

export function loadConfig(): GatewayConfig {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is required");
  }

  return {
    port: Number(process.env.PORT) || 4000,
    jwtSecret,
    redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
    freeTierDailyLimit: Number(process.env.FREE_TIER_DAILY_LIMIT) || 5,
    proxyTimeoutMs: 30_000,
    frontendUrl: (process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, ""),
    frontendResetPasswordPath:
      process.env.FRONTEND_RESET_PASSWORD_PATH?.trim() || "/reset-password",
    services: {
      auth: {
        url: process.env.AUTH_SERVICE_URL ?? "http://auth-service:3001",
        pathRewrite: { "^/api/auth": "/api/v1/auth" },
      },
      authV1: {
        url: process.env.AUTH_SERVICE_URL ?? "http://auth-service:3001",
        pathRewrite: {},
      },
      ai: {
        url: process.env.AI_SERVICE_URL ?? "http://ai-service:5002",
        pathRewrite: { "^/api/ai": "" },
      },
      course: {
        url: process.env.COURSE_SERVICE_URL ?? "http://course-service:5003",
        pathRewrite: { "^/api/courses": "" },
      },
      progress: {
        url: process.env.PROGRESS_SERVICE_URL ?? "http://progress-service:5004",
        pathRewrite: { "^/api/progress": "" },
      },
    },
  };
}
