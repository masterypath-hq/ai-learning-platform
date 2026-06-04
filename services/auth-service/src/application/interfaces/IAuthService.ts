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

/** Port for auth operations. Controller depends on this abstraction (DIP). */
export interface IAuthService {
  signUp(email: string, password: string, name?: string): Promise<SignUpResponse>;
  signIn(email: string, password: string): Promise<SignInResponse>;
  googleSignIn(code: string, state: string): Promise<GoogleSignInResponse>;
  getGoogleAuthUrl(): Promise<string>;
  createGoogleCallbackSession(result: GoogleSignInResponse): Promise<string>;
  exchangeGoogleCallbackCode(code: string): Promise<GoogleSignInResponse>;
  githubSignIn(code: string, state: string): Promise<GithubSignInResponse>;
  getGithubAuthUrl(): Promise<string>;
  createGithubCallbackSession(result: GithubSignInResponse): Promise<string>;
  exchangeGithubCallbackCode(code: string): Promise<GithubSignInResponse>;
  forgotPassword(email: string, resetLinkBaseUrl: string): Promise<ForgotPasswordResponse>;
  resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponse>;
  getMe(userId: string): Promise<UserProfileResponse>;
  refreshTokens(refreshToken: string): Promise<RefreshTokensResponse>;
}
