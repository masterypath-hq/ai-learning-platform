import type { RefreshTokensResponse } from "@ai-learning-platform/shared";
import { useAuthStore } from "./auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "error" in body) {
    const err = (body as { error: unknown }).error;
    if (typeof err === "string") return err;
    if (err && typeof err === "object" && "message" in err && typeof (err as { message?: unknown }).message === "string") {
      return (err as { message: string }).message;
    }
  }
  return fallback;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Attach the Bearer token. Default true. */
  auth?: boolean;
  /** Internal — prevents infinite refresh loops. */
  skipRefresh?: boolean;
}

async function rawFetch(path: string, options: RequestOptions): Promise<Response> {
  const { auth = true, body, headers } = options;
  const finalHeaders: Record<string, string> = { ...(headers as Record<string, string> | undefined) };
  if (body !== undefined) finalHeaders["Content-Type"] = "application/json";

  if (auth) {
    const token = useAuthStore.getState().accessToken;
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  return fetch(`${API_URL}${path}`, {
    method: options.method,
    signal: options.signal,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) return false;
    try {
      const res = await rawFetch("/api/auth/refresh", {
        method: "POST",
        body: { refreshToken },
        auth: false,
        skipRefresh: true,
      });
      if (!res.ok) {
        useAuthStore.getState().clearSession();
        return false;
      }
      const data = (await res.json()) as RefreshTokensResponse;
      useAuthStore.getState().setTokens(data.tokens);
      return true;
    } catch {
      useAuthStore.getState().clearSession();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/** Also exposes `X-RateLimit-*` response headers via `onHeaders`, since chat/knowledge-check limits live there. */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
  onHeaders?: (headers: Headers) => void
): Promise<T> {
  let res = await rawFetch(path, options);

  if (res.status === 401 && options.auth !== false && !options.skipRefresh) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await rawFetch(path, options);
    }
  }

  onHeaders?.(res.headers);

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, extractErrorMessage(body, res.statusText), body);
  }

  return body as T;
}
