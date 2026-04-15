import type { RefreshToken } from "../../domain/models/RefreshToken.js";

export interface IRefreshTokenRepository {
  save(token: RefreshToken): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  revoke(id: string, revokedAt: Date): Promise<void>;
}
