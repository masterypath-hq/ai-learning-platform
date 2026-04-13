import type {
  IGoogleAuthProvider,
  GoogleUserInfo,
} from "../../application/interfaces/IGoogleAuthProvider.js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export class GoogleAuthProvider implements IGoogleAuthProvider {
  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly redirectUri: string
  ) {}

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      state,
      prompt: "consent",
    });
    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForUserInfo(code: string): Promise<GoogleUserInfo> {
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const body = await tokenResponse.text();
      throw new Error(`GOOGLE_TOKEN_EXCHANGE_FAILED: ${tokenResponse.status} ${body}`);
    }

    const tokens = (await tokenResponse.json()) as { id_token?: string };
    if (!tokens.id_token) {
      throw new Error("GOOGLE_TOKEN_EXCHANGE_FAILED: no id_token in response");
    }

    return this.decodeIdToken(tokens.id_token);
  }

  /**
   * Decode Google ID token (JWT) payload. We trust the token because it was
   * received directly from Google over TLS in the server-side code exchange.
   */
  private decodeIdToken(idToken: string): GoogleUserInfo {
    const parts = idToken.split(".");
    if (parts.length !== 3) {
      throw new Error("GOOGLE_INVALID_ID_TOKEN: malformed JWT");
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    ) as {
      sub?: string;
      email?: string;
      name?: string;
      email_verified?: boolean;
    };

    if (!payload.sub || !payload.email) {
      throw new Error("GOOGLE_INVALID_ID_TOKEN: missing sub or email");
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name ?? null,
      emailVerified: payload.email_verified ?? false,
    };
  }
}
