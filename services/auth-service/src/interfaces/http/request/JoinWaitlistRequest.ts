const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class JoinWaitlistRequest {
  private constructor(
    public readonly email: string,
    public readonly source: string | undefined
  ) {}

  static fromBody(body: unknown): { ok: true; request: JoinWaitlistRequest } | { ok: false; error: string } {
    if (!body || typeof body !== "object") {
      return { ok: false, error: "email required" };
    }
    const b = body as Record<string, unknown>;
    const email = typeof b.email === "string" ? b.email.trim() : "";
    if (!email || !EMAIL_RE.test(email)) {
      return { ok: false, error: "A valid email is required." };
    }
    const source = typeof b.source === "string" && b.source.trim() ? b.source.trim() : undefined;
    return { ok: true, request: new JoinWaitlistRequest(email, source) };
  }
}
