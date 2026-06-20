import type {
  IGithubAuthProvider,
  GithubUserInfo,
} from "../../application/interfaces/IGithubAuthProvider.js";

const GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";
const GITHUB_EMAILS_URL = "https://api.github.com/user/emails";

interface GithubEmailEntry {
  email: string;
  primary: boolean;
  verified: boolean;
}

export class GithubAuthProvider implements IGithubAuthProvider {
  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly redirectUri: string
  ) {}

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: "user:email",
      state,
    });
    return `${GITHUB_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForUserInfo(code: string): Promise<GithubUserInfo> {
    const tokenRes = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      throw new Error(`GITHUB_TOKEN_EXCHANGE_FAILED: ${tokenRes.status} ${body}`);
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      throw new Error(`GITHUB_TOKEN_EXCHANGE_FAILED: ${tokenData.error ?? "no access_token"}`);
    }

    const accessToken = tokenData.access_token;

    const userRes = await fetch(GITHUB_USER_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!userRes.ok) {
      throw new Error(`GITHUB_USER_FETCH_FAILED: ${userRes.status}`);
    }

    const user = (await userRes.json()) as {
      id: number;
      name: string | null;
      email: string | null;
    };

    let email = user.email;
    if (!email) {
      email = await this.fetchPrimaryEmail(accessToken);
    }

    if (!email) {
      throw new Error("GITHUB_NO_EMAIL: account has no accessible email address");
    }

    return {
      githubId: String(user.id),
      email: email.toLowerCase().trim(),
      name: user.name ?? null,
      emailVerified: true,
    };
  }

  private async fetchPrimaryEmail(accessToken: string): Promise<string | null> {
    const res = await fetch(GITHUB_EMAILS_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!res.ok) return null;
    const emails = (await res.json()) as GithubEmailEntry[];
    const primary = emails.find((e) => e.primary && e.verified);
    return primary?.email ?? null;
  }
}
