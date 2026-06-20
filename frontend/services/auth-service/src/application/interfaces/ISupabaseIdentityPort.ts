import type { Session, User } from "@supabase/supabase-js";

export interface SignUpResult {
  user: User | null;
  session: Session | null;
  errorMessage: string | null;
}

export interface SignInResult {
  user: User | null;
  session: Session | null;
  errorMessage: string | null;
}

export interface RefreshResult {
  session: Session | null;
  errorMessage: string | null;
}

export interface OAuthRedirectResult {
  url: string | null;
  errorMessage: string | null;
}

export interface ExchangeCodeResult {
  session: Session | null;
  errorMessage: string | null;
}

/** Port for Supabase Auth SDK (anon key). Single responsibility: identity provider API. */
export interface ISupabaseIdentityPort {
  signUpWithPassword(email: string, password: string): Promise<SignUpResult>;
  signInWithPassword(email: string, password: string): Promise<SignInResult>;
  refreshSession(refreshToken: string): Promise<RefreshResult>;
  getGoogleOAuthRedirectUrl(redirectTo: string): Promise<OAuthRedirectResult>;
  exchangeCodeForSession(code: string): Promise<ExchangeCodeResult>;
}
