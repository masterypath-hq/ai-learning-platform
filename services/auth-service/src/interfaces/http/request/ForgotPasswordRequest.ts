export class ForgotPasswordRequest {
  private constructor(public readonly email: string) {}

  static fromBody(body: unknown): { ok: true; request: ForgotPasswordRequest } | { ok: false; error: string } {
    if (!body || typeof body !== "object") {
      return { ok: false, error: "email required" };
    }
    const b = body as Record<string, unknown>;
    const email = typeof b.email === "string" ? b.email.trim() : "";
    if (!email) return { ok: false, error: "email required" };
    return { ok: true, request: new ForgotPasswordRequest(email) };
  }
}
