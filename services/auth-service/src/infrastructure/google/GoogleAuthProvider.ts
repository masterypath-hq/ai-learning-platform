import type {
  IGoogleAuthProvider,
  GoogleUserInfo,
} from "../../application/interfaces/IGoogleAuthProvider.js";
import { createPublicKey } from "node:crypto";
import type { JsonWebKey as CryptoJsonWebKey } from "node:crypto";
import jwt from "jsonwebtoken";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000;

interface JwksKey {
  kid: string;
  [key: string]: unknown;
}

interface JwksCache {
  keys: JwksKey[];
  expiresAt: number;
}

let jwksCache: JwksCache | null = null;

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

    return this.verifyIdToken(tokens.id_token);
  }

  private async getJwksKey(kid: string): Promise<JwksKey> {
    const now = Date.now();
    if (!jwksCache || jwksCache.expiresAt < now) {
      const res = await fetch(GOOGLE_JWKS_URL);
      if (!res.ok) throw new Error(`GOOGLE_JWKS_FETCH_FAILED: ${res.status}`);
      const data = (await res.json()) as { keys: JwksKey[] };
      jwksCache = { keys: data.keys, expiresAt: now + JWKS_CACHE_TTL_MS };
    }
    const key = jwksCache.keys.find((k) => k.kid === kid);
    if (!key) {
      const res = await fetch(GOOGLE_JWKS_URL);
      if (!res.ok) throw new Error(`GOOGLE_JWKS_FETCH_FAILED: ${res.status}`);
      const data = (await res.json()) as { keys: JwksKey[] };
      jwksCache = { keys: data.keys, expiresAt: Date.now() + JWKS_CACHE_TTL_MS };
      const refreshed = jwksCache.keys.find((k) => k.kid === kid);
      if (!refreshed) throw new Error(`GOOGLE_INVALID_ID_TOKEN: signing key ${kid} not found`);
      return refreshed;
    }
    return key;
  }

  private async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
    const parts = idToken.split(".");
    if (parts.length !== 3) throw new Error("GOOGLE_INVALID_ID_TOKEN: malformed JWT");

    const header = JSON.parse(
      Buffer.from(parts[0], "base64url").toString("utf-8")
    ) as { kid?: string };
    if (!header.kid) throw new Error("GOOGLE_INVALID_ID_TOKEN: missing kid in header");

    const jwk = await this.getJwksKey(header.kid);
    const publicKey = createPublicKey({ key: jwk as unknown as CryptoJsonWebKey, format: "jwk" }).export({
      type: "spki",
      format: "pem",
    }) as string;

    const payload = jwt.verify(idToken, publicKey, {
      algorithms: ["RS256"],
      audience: this.clientId,
      issuer: ["https://accounts.google.com", "accounts.google.com"],
    }) as { sub?: string; email?: string; name?: string; email_verified?: boolean };

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
