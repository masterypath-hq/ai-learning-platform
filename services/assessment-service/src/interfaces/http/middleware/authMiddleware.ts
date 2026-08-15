import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction, RequestHandler } from "express";

export type AuthedRequest = Request & { userId: string };

/** Verifies Bearer JWT and attaches userId to the request. (SOLID: S.) */
export function createAuthMiddleware(jwtSecret: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      res.status(401).json({ success: false, data: null, error: "No token" });
      return;
    }
    const token = auth.slice(7);
    try {
      const decoded = jwt.verify(token, jwtSecret) as { userId?: string };
      if (!decoded?.userId) {
        res.status(401).json({ success: false, data: null, error: "Invalid token" });
        return;
      }
      (req as AuthedRequest).userId = decoded.userId;
      next();
    } catch {
      res.status(401).json({ success: false, data: null, error: "Invalid or expired token" });
    }
  };
}
