export class ResetPasswordRequest {
  private constructor(
    public readonly token: string,
    public readonly newPassword: string
  ) {}

  static fromBody(body: unknown): { ok: true; request: ResetPasswordRequest } | { ok: false; error: string } {
    if (!body || typeof body !== "object") {
      return { ok: false, error: "token and newPassword required" };
    }
    const b = body as Record<string, unknown>;
    const token = typeof b.token === "string" ? b.token : "";
    const newPassword = typeof b.newPassword === "string" ? b.newPassword : "";
    if (!token || !newPassword) {
      return { ok: false, error: "token and newPassword required" };
    }
    return { ok: true, request: new ResetPasswordRequest(token, newPassword) };
  }
}
