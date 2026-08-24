import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import type { AuthController } from "../controllers/AuthController.js";

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export class AuthResource {
  constructor(
    private readonly app: Express,
    private readonly controller: AuthController,
    private readonly bearerAuth: RequestHandler
  ) {}

  register(): void {
    this.app.post("/api/v1/auth/sign-up", this.wrapAsync((req, res) => this.controller.signUp(req, res)));
    this.app.post("/api/v1/auth/sign-in", this.wrapAsync((req, res) => this.controller.signIn(req, res)));
    this.app.post("/api/v1/auth/refresh", this.wrapAsync((req, res) => this.controller.refreshTokens(req, res)));
    this.app.get("/api/v1/auth/google", this.wrapAsync((req, res) => this.controller.googleRedirect(req, res)));
    this.app.get("/api/v1/auth/google/callback", this.wrapAsync((req, res) => this.controller.googleCallback(req, res)));
    this.app.post("/api/v1/auth/google/exchange", this.wrapAsync((req, res) => this.controller.exchangeGoogleCallback(req, res)));
    this.app.get("/api/v1/auth/github", this.wrapAsync((req, res) => this.controller.githubRedirect(req, res)));
    this.app.get("/api/v1/auth/github/callback", this.wrapAsync((req, res) => this.controller.githubCallback(req, res)));
    this.app.post("/api/v1/auth/github/exchange", this.wrapAsync((req, res) => this.controller.exchangeGithubCallback(req, res)));
    this.app.post("/api/v1/auth/forgot-password", this.wrapAsync((req, res) => this.controller.forgotPassword(req, res)));
    this.app.post("/api/v1/auth/reset-password", this.wrapAsync((req, res) => this.controller.resetPassword(req, res)));
    this.app.get("/api/v1/auth/me", this.bearerAuth, this.wrapAsync((req, res) => this.controller.getMe(req, res)));
    this.app.patch("/api/v1/auth/me", this.bearerAuth, this.wrapAsync((req, res) => this.controller.updateMe(req, res)));
  }

  private wrapAsync(handler: AsyncHandler) {
    return (req: Request, res: Response, next: NextFunction) => {
      handler(req, res, next).catch(next);
    };
  }
}
