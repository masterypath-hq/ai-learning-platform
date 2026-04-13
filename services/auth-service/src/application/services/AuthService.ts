import type { ISignUpAction } from "../interfaces/ISignUpAction.js";
import type { ISignInAction } from "../interfaces/ISignInAction.js";
import type { IGoogleSignInAction } from "../interfaces/IGoogleSignInAction.js";
import type { IForgotPasswordAction } from "../interfaces/IForgotPasswordAction.js";
import type { IResetPasswordAction } from "../interfaces/IResetPasswordAction.js";
import type { IGoogleAuthProvider } from "../interfaces/IGoogleAuthProvider.js";
import type {
  SignUpResponse,
  SignInResponse,
  GoogleSignInResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
} from "@ai-learning-platform/shared";
import type { IAuthService } from "../interfaces/IAuthService.js";
import crypto from "node:crypto";

/**
 * Application service: single entry for auth operations. Delegates to actions.
 * (SOLID: D — depends on action interfaces only, not concretions.)
 */
export class AuthService implements IAuthService {
  constructor(
    private readonly signUpAction: ISignUpAction,
    private readonly signInAction: ISignInAction,
    private readonly googleSignInAction: IGoogleSignInAction,
    private readonly forgotPasswordAction: IForgotPasswordAction,
    private readonly resetPasswordAction: IResetPasswordAction,
    private readonly googleAuthProvider: IGoogleAuthProvider
  ) {}

  async signUp(email: string, password: string, name?: string): Promise<SignUpResponse> {
    return this.signUpAction.execute(email, password, name);
  }

  async signIn(email: string, password: string): Promise<SignInResponse> {
    return this.signInAction.execute(email, password);
  }

  getGoogleAuthUrl(): string {
    const state = crypto.randomBytes(32).toString("hex");
    return this.googleAuthProvider.getAuthorizationUrl(state);
  }

  async googleSignIn(code: string): Promise<GoogleSignInResponse> {
    return this.googleSignInAction.execute(code);
  }

  async forgotPassword(email: string, resetLinkBaseUrl: string): Promise<ForgotPasswordResponse> {
    return this.forgotPasswordAction.execute(email, resetLinkBaseUrl);
  }

  async resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponse> {
    return this.resetPasswordAction.execute(token, newPassword);
  }
}
