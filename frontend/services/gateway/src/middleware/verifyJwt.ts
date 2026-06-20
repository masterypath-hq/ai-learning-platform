import jwt from "jsonwebtoken";
import type { RequestHandler } from "express";

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

export function createVerifyJwt(secret: string): RequestHandler {
  return (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token" });
      return;
    }

    try {
      const decoded = jwt.verify(auth.slice(7), secret) as JwtPayload;
      req.user = decoded;
      req.headers["x-user-id"] = decoded.userId;
      req.headers["x-user-email"] = decoded.email;
      req.headers["x-plan-tier"] = decoded.planTier ?? "free";
      next();
    } catch {
      res.status(401).json({ error: "Invalid or expired token" });
    }
  };
}
