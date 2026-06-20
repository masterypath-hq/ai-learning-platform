import type { IUserRepository } from "../interfaces/IUserRepository.js";
import type { IRefreshTokenRepository } from "../interfaces/IRefreshTokenRepository.js";
import type { ISessionTokensIssuer } from "../interfaces/ISessionTokensIssuer.js";
import type { RefreshTokensResponse } from "@ai-learning-platform/shared";
import type { IRefreshTokensAction } from "../interfaces/IRefreshTokensAction.js";
import { hashOpaqueToken } from "../../lib/tokenHash.js";

/** Validates opaque refresh token, rotates it, issues new access + refresh pair. */
export class RefreshTokensAction implements IRefreshTokensAction {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly sessionTokensIssuer: ISessionTokensIssuer
  ) {}

  async execute(refreshToken: string): Promise<RefreshTokensResponse> {
    const tokenHash = hashOpaqueToken(refreshToken.trim());
    const row = await this.refreshTokenRepo.findByTokenHash(tokenHash);
    if (!row || row.isRevoked() || row.isExpired()) {
      throw new Error("INVALID_REFRESH_TOKEN");
    }

    const user = await this.userRepo.findById(row.userId);
    if (!user) throw new Error("INVALID_REFRESH_TOKEN");

    const now = new Date();
    await this.refreshTokenRepo.revoke(row.id, now);

    const tokens = await this.sessionTokensIssuer.issueForUser(user);

    return {
      userId: user.id,
      email: user.email,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresInSeconds: tokens.expiresInSeconds,
        refreshExpiresInSeconds: tokens.refreshExpiresInSeconds,
      },
    };
  }
}
