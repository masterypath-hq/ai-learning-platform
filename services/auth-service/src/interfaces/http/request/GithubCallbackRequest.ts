export class GithubCallbackRequest {
  private constructor(
    public readonly code: string,
    public readonly state: string
  ) {}

  static fromQuery(
    query: unknown
  ): { ok: true; request: GithubCallbackRequest } | { ok: false; error: string } {
    if (!query || typeof query !== "object") {
      return { ok: false, error: "code and state query parameters required" };
    }
    const q = query as Record<string, unknown>;

    if (typeof q.error === "string") {
      return { ok: false, error: `GitHub OAuth error: ${q.error}` };
    }

    const code = typeof q.code === "string" ? q.code : "";
    const state = typeof q.state === "string" ? q.state : "";
    if (!code || !state) {
      return { ok: false, error: "code and state query parameters required" };
    }
    return { ok: true, request: new GithubCallbackRequest(code, state) };
  }
}
