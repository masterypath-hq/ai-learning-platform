import type { LearningPath, Session, GenerateCurriculumPayload } from "./learning";

// Generic API response wrapper — update shape to match co-founder's API
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status: number;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

// POST /api/v1/auth/sign-up
export interface SignUpRequest {
  email: string;
  password: string;
  name: string; // combined "firstName lastName" from the form
}

// Confirmed shape from a live 200 OK response (local backend via ngrok, 2026-06-08):
// { userId, email, tokens: { accessToken, refreshToken, expiresInSeconds, refreshExpiresInSeconds } }
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  refreshExpiresInSeconds: number;
}

export interface SignUpResponse {
  userId: string;
  email: string;
  tokens: AuthTokens;
}

// POST /api/v1/auth/sign-in — same response shape as sign-up
export interface SignInRequest {
  email: string;
  password: string;
}

export type SignInResponse = SignUpResponse;

// POST /api/v1/auth/forgot-password
export interface ForgotPasswordRequest {
  email: string;
}

// Backend always returns a generic message (doesn't reveal if the account exists).
export interface ForgotPasswordResponse {
  message: string;
}

// Request types
export type GenerateCurriculumRequest = GenerateCurriculumPayload;

export interface SendChatMessageRequest {
  sessionId: string;
  message: string;
}

// Response types
export type GetLearningPathsResponse = ApiResponse<LearningPath[]>;
export type GetSessionResponse = ApiResponse<Session>;
export type GenerateCurriculumResponse = ApiResponse<{ sessionId: string; path: LearningPath }>;
