import crypto from "node:crypto";

export function hashOpaqueToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken, "utf8").digest("hex");
}
