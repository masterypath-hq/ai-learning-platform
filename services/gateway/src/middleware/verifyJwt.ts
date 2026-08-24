import jwt from "jsonwebtoken";
import type { RequestHandler } from "express";
import type { RedisClient } from "../lib/redis.js";

export interface JwtPayload {
  userId: string;
  email: string;
  planTier: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Reads the live tier from Redis (`tier:{userId}`, written by auth-service's billing
 * webhooks) so an upgrade/downgrade applies without waiting for the next login. Falls
 * back to the JWT's `planTier` claim on a cache miss or Redis error — bounded staleness
 * of at most the access token's TTL. A literal DB fallback (as CLAUDE.md's Stage 8 text
 * describes) would require the gateway to either own a Postgres connection to auth-service's
 * DB or make an HTTP call on every proxied request; this is the deliberate, documented
 * trade-off instead.
 */
export function createVerifyJwt(secret: string, redis: RedisClient): RequestHandler {
  return async (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token" });
      return;
    }

    try {
      const decoded = jwt.verify(auth.slice(7), secret) as JwtPayload;

      let planTier = decoded.planTier ?? "free";
      try {
        const cachedTier = await redis.get(`tier:${decoded.userId}`);
        if (cachedTier) planTier = cachedTier;
      } catch (err) {
        console.error("[gateway] Tier cache lookup failed, falling back to JWT claim:", err);
      }

      req.user = { ...decoded, planTier };
      req.headers["x-user-id"] = decoded.userId;
      req.headers["x-user-email"] = decoded.email;
      req.headers["x-plan-tier"] = planTier;
      next();
    } catch {
      res.status(401).json({ error: "Invalid or expired token" });
    }
  };
}
