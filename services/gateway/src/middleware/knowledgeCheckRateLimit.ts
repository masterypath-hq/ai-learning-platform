import type { RequestHandler } from "express";
import type { RedisClient } from "../lib/redis.js";
import type { JwtPayload } from "./verifyJwt.js";

interface RateLimitDeps {
  redis: RedisClient;
  dailyLimit: number;
}

/**
 * Matches `/quizzes/generate` — the only client-facing quiz-generation path (knowledge
 * checks). Module/course-final quizzes are generated server-to-server by assessment-service
 * directly against ai-service, bypassing the gateway entirely, so they never hit this path.
 */
const GENERATE_QUIZ_PATH = /^\/quizzes\/generate$/;

export function createKnowledgeCheckRateLimit({ redis, dailyLimit }: RateLimitDeps): RequestHandler {
  return async (req, res, next) => {
    if (req.method !== "POST" || !GENERATE_QUIZ_PATH.test(req.path)) {
      next();
      return;
    }

    const user = req.user as JwtPayload | undefined;
    if (!user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (user.planTier !== "free") {
      next();
      return;
    }

    const today = new Date().toISOString().slice(0, 10); // UTC YYYY-MM-DD
    const key = `ratelimit:${user.userId}:knowledge_check:${today}`;

    try {
      const count = await redis.incr(key);

      if (count === 1) {
        const now = new Date();
        const midnight = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 1,
        ));
        await redis.expireat(key, Math.floor(midnight.getTime() / 1000));
      }

      const remaining = Math.max(0, dailyLimit - count);
      res.setHeader("X-RateLimit-Limit", String(dailyLimit));
      res.setHeader("X-RateLimit-Remaining", String(remaining));

      if (count > dailyLimit) {
        res.status(429).json({
          error: "Daily limit reached",
          upgrade_url: "/pricing",
        });
        return;
      }

      next();
    } catch (err) {
      console.error("[gateway] Rate limit check failed:", err);
      next();
    }
  };
}
