import type { RequestHandler } from "express";
import type { RedisClient } from "../lib/redis.js";

interface SignInRateLimitDeps {
  redis: RedisClient;
  maxAttempts: number;
  windowSeconds: number;
}

export function createSignInRateLimit({ redis, maxAttempts, windowSeconds }: SignInRateLimitDeps): RequestHandler {
  return async (req, res, next) => {
    const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0].trim()
      ?? req.socket.remoteAddress
      ?? "unknown";

    const key = `ratelimit:signin:${ip}`;

    try {
      const count = await redis.incr(key);
      console.log(count);
      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      const ttl = await redis.ttl(key);
      res.setHeader("X-RateLimit-Limit", String(maxAttempts));
      res.setHeader("X-RateLimit-Remaining", String(Math.max(0, maxAttempts - count)));
      res.setHeader("X-RateLimit-Reset", String(Math.floor(Date.now() / 1000) + ttl));

      if (count > maxAttempts) {
        res.status(429).json({ error: "Too many sign-in attempts. Please try again later." });
        return;
      }

      next();
    } catch (err) {
      console.error("[gateway] Sign-in rate limit check failed:", err);
      next();
    }
  };
}
