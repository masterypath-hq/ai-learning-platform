const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function validateRegisterInput(
  email: unknown,
  password: unknown,
  fullName: unknown,
): { ok: true; email: string; password: string; fullName: string } | { ok: false; error: string } {
  if (typeof email !== "string" || !email.trim()) {
    return { ok: false, error: "email is required" };
  }
  if (!isValidEmail(email)) {
    return { ok: false, error: "invalid email format" };
  }
  if (typeof password !== "string" || password.length < 8) {
    return { ok: false, error: "password must be at least 8 characters" };
  }
  if (typeof fullName !== "string" || !fullName.trim()) {
    return { ok: false, error: "full_name is required" };
  }
  return { ok: true, email: email.trim().toLowerCase(), password, fullName: fullName.trim() };
}

export function validateLoginInput(
  email: unknown,
  password: unknown,
): { ok: true; email: string; password: string } | { ok: false; error: string } {
  if (typeof email !== "string" || !email.trim()) {
    return { ok: false, error: "email is required" };
  }
  if (typeof password !== "string" || !password) {
    return { ok: false, error: "password is required" };
  }
  return { ok: true, email: email.trim().toLowerCase(), password };
}

export function validateRefreshBody(
  refreshToken: unknown,
): { ok: true; refreshToken: string } | { ok: false; error: string } {
  if (typeof refreshToken !== "string" || !refreshToken.trim()) {
    return { ok: false, error: "refresh_token is required" };
  }
  return { ok: true, refreshToken: refreshToken.trim() };
}
