import type { Request, RequestHandler } from "express";
import type { ITokenService, TokenPayload } from "../../../application/interfaces/ITokenService.js";

export type AuthedRequest = Request & { auth: TokenPayload };

export function createBearerAuthMiddleware(tokenService: ITokenService): RequestHandler {
  return async (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token" });
      return;
    }
    const payload = await tokenService.verifyAccessToken(auth.slice(7));
    if (!payload) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }
    (req as AuthedRequest).auth = payload;
    next();
  };
}
