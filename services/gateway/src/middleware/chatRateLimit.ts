import type { RequestHandler } from "express";
import type { RedisClient } from "../lib/redis.js";
import type { JwtPayload } from "./verifyJwt.js";

interface RateLimitDeps {
  redis: RedisClient;
  dailyLimit: number;
}

export function createChatRateLimit({ redis, dailyLimit }: RateLimitDeps): RequestHandler {
  return async (req, res, next) => {
    if (req.method !== "POST" || req.path !== "/chat/stream") {
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

    const key = `ratelimit:${user.userId}:chat`;

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
