import type { Request, Response } from "express";
import type { IAuthService } from "../../../application/interfaces/IAuthService.js";
import { SignUpRequest } from "../request/SignUpRequest.js";
import { SignInRequest } from "../request/SignInRequest.js";
import { ForgotPasswordRequest } from "../request/ForgotPasswordRequest.js";
import { ResetPasswordRequest } from "../request/ResetPasswordRequest.js";

const HTTP = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
} as const;

function getResetLinkBaseUrl(req: Request): string {
  const base = process.env.RESET_LINK_BASE_URL;
  if (base) return base;
  const host = req.get("host") ?? "localhost:3000";
  const protocol = req.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

/** Controller: HTTP → Request objects → Service. (SOLID: S, D — depends on IAuthService.) */
export class AuthController {
  constructor(private readonly authService: IAuthService) {}

  async signUp(req: Request, res: Response): Promise<void> {
    const parsed = SignUpRequest.fromBody(req.body);
    if (!parsed.ok) {
      res.status(HTTP.BAD_REQUEST).json({ error: parsed.error });
      return;
    }
    try {
      const result = await this.authService.signUp(
        parsed.request.email,
        parsed.request.password,
        parsed.request.name
      );
      res.status(HTTP.OK).json(result);
    } catch (e) {
      if (e instanceof Error && e.message === "USER_ALREADY_EXISTS") {
        res.status(HTTP.CONFLICT).json({ error: "An account with this email already exists." });
        return;
      }
      throw e;
    }
  }

  async signIn(req: Request, res: Response): Promise<void> {
    const parsed = SignInRequest.fromBody(req.body);
    if (!parsed.ok) {
      res.status(HTTP.BAD_REQUEST).json({ error: parsed.error });
      return;
    }
    try {
      const result = await this.authService.signIn(parsed.request.email, parsed.request.password);
      res.status(HTTP.OK).json(result);
    } catch (e) {
      if (e instanceof Error && e.message === "INVALID_CREDENTIALS") {
        res.status(HTTP.UNAUTHORIZED).json({ error: "Invalid email or password." });
        return;
      }
      throw e;
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const parsed = ForgotPasswordRequest.fromBody(req.body);
    if (!parsed.ok) {
      res.status(HTTP.BAD_REQUEST).json({ error: parsed.error });
      return;
    }
    const result = await this.authService.forgotPassword(
      parsed.request.email,
      getResetLinkBaseUrl(req)
    );
    res.status(HTTP.OK).json(result);
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const parsed = ResetPasswordRequest.fromBody(req.body);
    if (!parsed.ok) {
      res.status(HTTP.BAD_REQUEST).json({ error: parsed.error });
      return;
    }
    try {
      const result = await this.authService.resetPassword(
        parsed.request.token,
        parsed.request.newPassword
      );
      res.status(HTTP.OK).json(result);
    } catch (e) {
      if (e instanceof Error && e.message === "INVALID_OR_EXPIRED_TOKEN") {
        res.status(HTTP.UNPROCESSABLE).json({
          error: "Invalid or expired reset link. Please request a new one.",
        });
        return;
      }
      if (e instanceof Error && e.message === "USER_NOT_FOUND") {
        res.status(HTTP.UNPROCESSABLE).json({ error: "User not found." });
        return;
      }
      throw e;
    }
  }
}
