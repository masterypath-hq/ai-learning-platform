/**
 * Auth API contracts (v1).
 * Consumed by frontend and auth service. No implementation details.
 */

// ----- Request DTOs -----

export interface SignUpRequest {
  email: string;
  password: string;
  name?: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ----- Response DTOs -----

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  /** Seconds until refresh token expires (opaque token stored server-side). */
  refreshExpiresInSeconds: number;
}

export interface SignUpResponse {
  userId: string;
  email: string;
  tokens: AuthTokens;
}

export interface SignInResponse {
  userId: string;
  email: string;
  tokens: AuthTokens;
}

export interface GoogleSignInResponse {
  userId: string;
  email: string;
  tokens: AuthTokens;
  isNewUser: boolean;
}

export interface GithubSignInResponse {
  userId: string;
  email: string;
  tokens: AuthTokens;
  isNewUser: boolean;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

// GET /me — cached profile (Redis in auth service, 15 min TTL)
export interface UserProfileResponse {
  userId: string;
  email: string;
  name?: string | null;
  planTier: string;
  authProvider: string;
}

export interface RefreshTokensResponse {
  userId: string;
  email: string;
  tokens: AuthTokens;
}

// ----- Waitlist (pre-launch Pro / Finance & Trading email capture) -----

export interface JoinWaitlistRequest {
  email: string;
  /** Where the signup happened, e.g. "pro-pricing" | "finance-track" — for later segmentation. */
  source?: string;
}

export interface JoinWaitlistResponse {
  message: string;
  alreadyJoined: boolean;
}

// ----- Domain events (for choreography) -----

export const AUTH_EVENTS = {
  USER_REGISTERED: "auth.user.registered.v1",
  USER_SIGNED_IN_GOOGLE: "auth.user.signed_in_google.v1",
  USER_SIGNED_IN_GITHUB: "auth.user.signed_in_github.v1",
  PASSWORD_RESET_REQUESTED: "auth.password_reset.requested.v1",
  PASSWORD_RESET_COMPLETED: "auth.password_reset.completed.v1",
} as const;

export interface UserRegisteredPayload {
  userId: string;
  email: string;
  name?: string;
  registeredAt: string; // ISO 8601
}

export interface GoogleSignInPayload {
  userId: string;
  email: string;
  isNewUser: boolean;
  linkedExistingAccount: boolean;
  signedInAt: string;
}

export interface PasswordResetRequestedPayload {
  userId: string;
  email: string;
  resetTokenId: string;
  requestedAt: string;
}

export interface PasswordResetCompletedPayload {
  userId: string;
  completedAt: string;
}
