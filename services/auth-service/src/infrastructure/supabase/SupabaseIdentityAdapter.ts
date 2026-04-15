import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ISupabaseIdentityPort,
  SignUpResult,
  SignInResult,
  RefreshResult,
  OAuthRedirectResult,
  ExchangeCodeResult,
} from "../../application/interfaces/ISupabaseIdentityPort.js";

export class SupabaseIdentityAdapter implements ISupabaseIdentityPort {
  constructor(private readonly supabaseAuth: SupabaseClient) {}

  async signUpWithPassword(email: string, password: string): Promise<SignUpResult> {
    const { data, error } = await this.supabaseAuth.auth.signUp({ email, password });
    return {
      user: data.user ?? null,
      session: data.session ?? null,
      errorMessage: error?.message ?? null,
    };
  }

  async signInWithPassword(email: string, password: string): Promise<SignInResult> {
    const { data, error } = await this.supabaseAuth.auth.signInWithPassword({ email, password });
    return {
      user: data.user ?? null,
      session: data.session ?? null,
      errorMessage: error?.message ?? null,
    };
  }

  async refreshSession(refreshToken: string): Promise<RefreshResult> {
    const { data, error } = await this.supabaseAuth.auth.refreshSession({ refresh_token: refreshToken });
    return {
      session: data.session ?? null,
      errorMessage: error?.message ?? null,
    };
  }

  async getGoogleOAuthRedirectUrl(redirectTo: string): Promise<OAuthRedirectResult> {
    const { data, error } = await this.supabaseAuth.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    return {
      url: data.url ?? null,
      errorMessage: error?.message ?? null,
    };
  }

  async exchangeCodeForSession(code: string): Promise<ExchangeCodeResult> {
    const { data, error } = await this.supabaseAuth.auth.exchangeCodeForSession(code);
    return {
      session: data.session ?? null,
      errorMessage: error?.message ?? null,
    };
  }
}
