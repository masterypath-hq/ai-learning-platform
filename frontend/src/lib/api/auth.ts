import { apiClient } from "./axios-instance";
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  SignInRequest,
  SignInResponse,
  SignUpRequest,
  SignUpResponse,
} from "@/types/api";

// Both endpoints live under /api/v1/auth — the Postman collection shows some
// paths without the v1 prefix, but those 404 on the deployed service. Confirmed
// against the live API: /api/v1/auth/sign-up and /api/v1/auth/sign-in both work
// (when the backend isn't hitting its `github_id` column bug).

// POST /api/v1/auth/sign-up
export async function signUp(payload: SignUpRequest): Promise<SignUpResponse> {
  const { data } = await apiClient.post<SignUpResponse>(
    "/api/v1/auth/sign-up",
    payload
  );
  return data;
}

// POST /api/v1/auth/sign-in
export async function signIn(payload: SignInRequest): Promise<SignInResponse> {
  const { data } = await apiClient.post<SignInResponse>(
    "/api/v1/auth/sign-in",
    payload
  );
  return data;
}

// POST /api/v1/auth/forgot-password
// Sends a reset link to the email if an account exists. The response is always
// the same generic message regardless, so the UI shows one "check your email"
// state either way.
export async function forgotPassword(
  payload: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> {
  const { data } = await apiClient.post<ForgotPasswordResponse>(
    "/api/v1/auth/forgot-password",
    payload
  );
  return data;
}

// ─── OAuth (Google / Github) ──────────────────────────────────────────────────
//
// Flow (authorization-code with one-time code exchange):
//   1. User clicks "Continue with X" → browser navigates to the backend's
//      redirect endpoint (full page navigation, NOT XHR — OAuth crosses domains).
//   2. Backend 302s to Google/Github consent.
//   3. Provider 302s back to the BACKEND's callback with ?code&state.
//   4. Backend verifies, then 302s to OUR frontend callback with a one-time code.
//   5. Frontend exchanges that code here for real JWT tokens.

export type OAuthProvider = "google" | "github";

// Step 1 target — a full URL the browser navigates to (window.location.href).
// Must be absolute because it leaves the SPA entirely.
export function getOAuthStartUrl(provider: OAuthProvider): string {
  return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/${provider}`;
}

// Step 5 — GET /api/v1/auth/{provider}/exchange?code=<oneTimeCode>
// Returns the same { userId, email, tokens } shape as sign-in/sign-up.
export async function exchangeOAuthCode(
  provider: OAuthProvider,
  code: string
): Promise<SignInResponse> {
  const { data } = await apiClient.get<SignInResponse>(
    `/api/v1/auth/${provider}/exchange`,
    { params: { code } }
  );
  return data;
}
