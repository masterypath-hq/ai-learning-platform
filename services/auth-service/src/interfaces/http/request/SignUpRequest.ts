/** Request object for sign-up. (OOP: encapsulates and validates input.) */
export class SignUpRequest {
  private constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly name?: string
  ) {}

  static fromBody(body: unknown): { ok: true; request: SignUpRequest } | { ok: false; error: string } {
    if (!body || typeof body !== "object") {
      return { ok: false, error: "email and password required" };
    }
    const b = body as Record<string, unknown>;
    const email = typeof b.email === "string" ? b.email.trim() : "";
    const password = typeof b.password === "string" ? b.password : "";
    if (!email || !password) {
      return { ok: false, error: "email and password required" };
    }
    const name = typeof b.name === "string" ? b.name.trim() : undefined;
    return { ok: true, request: new SignUpRequest(email, password, name || undefined) };
  }
}
