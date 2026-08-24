import type { ISignUpAction } from "../interfaces/ISignUpAction.js";
import type { ISignInAction } from "../interfaces/ISignInAction.js";
import type { IGoogleSignInAction } from "../interfaces/IGoogleSignInAction.js";
import type { IGithubSignInAction } from "../interfaces/IGithubSignInAction.js";
import type { IForgotPasswordAction } from "../interfaces/IForgotPasswordAction.js";
import type { IResetPasswordAction } from "../interfaces/IResetPasswordAction.js";
import type { IGoogleAuthProvider } from "../interfaces/IGoogleAuthProvider.js";
import type { IGithubAuthProvider } from "../interfaces/IGithubAuthProvider.js";
import type {
  SignUpResponse,
  SignInResponse,
  GoogleSignInResponse,
  GithubSignInResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  UserProfileResponse,
  RefreshTokensResponse,
} from "@ai-learning-platform/shared";
import type { IAuthService } from "../interfaces/IAuthService.js";
import type { IGetMeAction } from "../interfaces/IGetMeAction.js";
import type { IPatchMeAction } from "../interfaces/IPatchMeAction.js";
import type { IRefreshTokensAction } from "../interfaces/IRefreshTokensAction.js";
import type { IGoogleStateStore } from "../interfaces/IGoogleStateStore.js";
import type { IGoogleCallbackStore } from "../interfaces/IGoogleCallbackStore.js";
import type { IGithubStateStore } from "../interfaces/IGithubStateStore.js";
import type { IGithubCallbackStore } from "../interfaces/IGithubCallbackStore.js";
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
    private readonly githubSignInAction: IGithubSignInAction,
    private readonly forgotPasswordAction: IForgotPasswordAction,
    private readonly resetPasswordAction: IResetPasswordAction,
    private readonly getMeAction: IGetMeAction,
    private readonly patchMeAction: IPatchMeAction,
    private readonly refreshTokensAction: IRefreshTokensAction,
    private readonly googleAuthProvider: IGoogleAuthProvider,
    private readonly googleStateStore: IGoogleStateStore,
    private readonly googleCallbackStore: IGoogleCallbackStore,
    private readonly githubAuthProvider: IGithubAuthProvider,
    private readonly githubStateStore: IGithubStateStore,
    private readonly githubCallbackStore: IGithubCallbackStore
  ) {}

  async signUp(email: string, password: string, name?: string): Promise<SignUpResponse> {
    return this.signUpAction.execute(email, password, name);
  }

  async signIn(email: string, password: string): Promise<SignInResponse> {
    return this.signInAction.execute(email, password);
  }

  async getGoogleAuthUrl(): Promise<string> {
    const state = crypto.randomBytes(32).toString("hex");
    await this.googleStateStore.save(state);
    return this.googleAuthProvider.getAuthorizationUrl(state);
  }

  async googleSignIn(code: string, state: string): Promise<GoogleSignInResponse> {
    const valid = await this.googleStateStore.consume(state);
    if (!valid) throw new Error("GOOGLE_INVALID_STATE");
    return this.googleSignInAction.execute(code);
  }

  async createGoogleCallbackSession(result: GoogleSignInResponse): Promise<string> {
    const code = crypto.randomBytes(32).toString("hex");
    await this.googleCallbackStore.save(code, result);
    return code;
  }

  async exchangeGoogleCallbackCode(code: string): Promise<GoogleSignInResponse> {
    const result = await this.googleCallbackStore.consume(code);
    if (!result) throw new Error("GOOGLE_INVALID_CALLBACK_CODE");
    return result;
  }

  async getGithubAuthUrl(): Promise<string> {
    const state = crypto.randomBytes(32).toString("hex");
    await this.githubStateStore.save(state);
    return this.githubAuthProvider.getAuthorizationUrl(state);
  }

  async githubSignIn(code: string, state: string): Promise<GithubSignInResponse> {
    const valid = await this.githubStateStore.consume(state);
    if (!valid) throw new Error("GITHUB_INVALID_STATE");
    return this.githubSignInAction.execute(code);
  }

  async createGithubCallbackSession(result: GithubSignInResponse): Promise<string> {
    const code = crypto.randomBytes(32).toString("hex");
    await this.githubCallbackStore.save(code, result);
    return code;
  }

  async exchangeGithubCallbackCode(code: string): Promise<GithubSignInResponse> {
    const result = await this.githubCallbackStore.consume(code);
    if (!result) throw new Error("GITHUB_INVALID_CALLBACK_CODE");
    return result;
  }

  async forgotPassword(email: string, resetLinkBaseUrl: string): Promise<ForgotPasswordResponse> {
    return this.forgotPasswordAction.execute(email, resetLinkBaseUrl);
  }

  async resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponse> {
    return this.resetPasswordAction.execute(token, newPassword);
  }

  async getMe(userId: string): Promise<UserProfileResponse> {
    return this.getMeAction.execute(userId);
  }

  async updateMe(userId: string, updates: { name?: string }): Promise<UserProfileResponse> {
    return this.patchMeAction.execute(userId, updates);
  }

  async refreshTokens(refreshToken: string): Promise<RefreshTokensResponse> {
    return this.refreshTokensAction.execute(refreshToken);
  }
}
