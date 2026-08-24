import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Guards service-to-service endpoints not meant for the public gateway (e.g. ai-service
 * <-> course-service, assessment-service <-> ai-service). Checks a shared secret header
 * rather than a user JWT since there is no end user on this call path.
 */
export function createInternalServiceMiddleware(internalServiceSecret: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const provided = req.headers["x-internal-secret"];
    if (provided !== internalServiceSecret) {
      res.status(401).json({ success: false, data: null, error: "Invalid or missing internal service secret" });
      return;
    }
    next();
  };
}
