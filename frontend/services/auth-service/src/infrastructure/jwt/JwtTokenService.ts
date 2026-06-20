import jwt from "jsonwebtoken";
import type { ITokenService, TokenPayload } from "../../application/interfaces/ITokenService.js";

export class JwtTokenService implements ITokenService {
  constructor(private readonly secret: string) {}

  async signAccessToken(payload: TokenPayload, expiresInSeconds: number): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(
        payload,
        this.secret,
        { expiresIn: expiresInSeconds },
        (err, encoded) => {
          if (err) reject(err);
          else resolve(encoded as string);
        }
      );
    });
  }

  async verifyAccessToken(token: string): Promise<TokenPayload | null> {
    return new Promise((resolve) => {
      jwt.verify(token, this.secret, (err, decoded) => {
        if (err) {
          resolve(null);
          return;
        }
        const d = decoded as { userId?: string; email?: string; planTier?: string };
        if (d?.userId && d?.email) {
          resolve({ userId: d.userId, email: d.email, planTier: d.planTier ?? "free" });
        } else {
          resolve(null);
        }
      });
    });
  }
}
