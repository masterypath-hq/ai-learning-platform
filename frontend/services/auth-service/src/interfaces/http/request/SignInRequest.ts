export class SignInRequest {
  private constructor(public readonly email: string, public readonly password: string) {}

  static fromBody(body: unknown): { ok: true; request: SignInRequest } | { ok: false; error: string } {
    if (!body || typeof body !== "object") {
      return { ok: false, error: "email and password required" };
    }
    const b = body as Record<string, unknown>;
    const email = typeof b.email === "string" ? b.email.trim() : "";
    const password = typeof b.password === "string" ? b.password : "";
    if (!email || !password) {
      return { ok: false, error: "email and password required" };
    }
    return { ok: true, request: new SignInRequest(email, password) };
  }
}
