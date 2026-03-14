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

// ----- Response DTOs -----

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresInSeconds: number;
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

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

// ----- Domain events (for choreography) -----

export const AUTH_EVENTS = {
  USER_REGISTERED: "auth.user.registered.v1",
  PASSWORD_RESET_REQUESTED: "auth.password_reset.requested.v1",
  PASSWORD_RESET_COMPLETED: "auth.password_reset.completed.v1",
} as const;

export interface UserRegisteredPayload {
  userId: string;
  email: string;
  name?: string;
  registeredAt: string; // ISO 8601
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
