import type {
  SignUpResponse,
  SignInResponse,
  GoogleSignInResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  UserProfileResponse,
  RefreshTokensResponse,
} from "@ai-learning-platform/shared";

/** Port for auth operations. Controller depends on this abstraction (DIP). */
export interface IAuthService {
  signUp(email: string, password: string, name?: string): Promise<SignUpResponse>;
  signIn(email: string, password: string): Promise<SignInResponse>;
  googleSignIn(code: string): Promise<GoogleSignInResponse>;
  getGoogleAuthUrl(): string;
  forgotPassword(email: string, resetLinkBaseUrl: string): Promise<ForgotPasswordResponse>;
  resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponse>;
  getMe(userId: string): Promise<UserProfileResponse>;
  refreshTokens(refreshToken: string): Promise<RefreshTokensResponse>;
}
