export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export function parseRefreshTokenBody(
  body: unknown
): { ok: true; request: RefreshTokenRequestDto } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const o = body as Record<string, unknown>;
  const refreshToken = o.refreshToken;
  if (typeof refreshToken !== "string" || refreshToken.trim() === "") {
    return { ok: false, error: "refreshToken is required." };
  }
  return { ok: true, request: { refreshToken: refreshToken.trim() } };
}
