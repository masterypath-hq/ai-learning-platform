import { createProxyMiddleware } from "http-proxy-middleware";
import type { Request, RequestHandler } from "express";
import type { ServiceTarget } from "../config/env.js";

interface ProxyOptions {
  target: ServiceTarget;
  timeoutMs: number;
}

/**
 * Apply `pathRewrite` rules to the **full** request path. When the proxy is mounted with
 * `app.use("/api/auth", proxy)`, Express sets `req.url` to the suffix only (e.g. `/me`), so
 * rules like `^/api/auth` never match. `req.originalUrl` keeps `/api/auth/me` and must be used.
 */
function buildPathRewrite(target: ServiceTarget) {
  const rules = Object.entries(target.pathRewrite);
  if (rules.length === 0) {
    return (_path: string, req: Request) => (req.originalUrl ?? _path).toString();
  }
  return (path: string, req: Request) => {
    const full = (req.originalUrl ?? path).toString();
    const q = full.indexOf("?");
    const pathname = q >= 0 ? full.slice(0, q) : full;
    const querySuffix = q >= 0 ? full.slice(q) : "";
    let out = pathname;
    for (const [pattern, replacement] of rules) {
      const re = new RegExp(pattern);
      if (re.test(out)) {
        out = out.replace(re, replacement);
        break;
      }
    }
    return out + querySuffix;
  };
}

export function createServiceProxy({ target, timeoutMs }: ProxyOptions): RequestHandler {
  return createProxyMiddleware({
    target: target.url,
    changeOrigin: true,
    pathRewrite: buildPathRewrite(target),
    proxyTimeout: timeoutMs,
    on: {
      error(_err, _req, res) {
        const response = res as import("http").ServerResponse;
        if (!response.headersSent) {
          response.writeHead(503, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ error: "Service unavailable" }));
        }
      },
    },
  }) as RequestHandler;
}
