import crypto from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import type { User } from "../../domain/models/User.js";
import { RefreshToken } from "../../domain/models/RefreshToken.js";
import type { ITokenService } from "../interfaces/ITokenService.js";
import type { IRefreshTokenRepository } from "../interfaces/IRefreshTokenRepository.js";
import type { ISessionTokensIssuer, SessionTokens } from "../interfaces/ISessionTokensIssuer.js";
import { hashOpaqueToken } from "../../lib/tokenHash.js";

const ACCESS_TOKEN_EXPIRES_SECONDS = 900;
const REFRESH_TOKEN_EXPIRES_SECONDS = 60 * 60 * 24 * 30; // 30 days

export class SessionTokensIssuer implements ISessionTokensIssuer {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly refreshTokenRepo: IRefreshTokenRepository
  ) {}

  async issueForUser(user: User): Promise<SessionTokens> {
    const accessToken = await this.tokenService.signAccessToken(
      { userId: user.id, email: user.email, planTier: user.planTier },
      ACCESS_TOKEN_EXPIRES_SECONDS
    );

    const rawRefresh = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashOpaqueToken(rawRefresh);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + REFRESH_TOKEN_EXPIRES_SECONDS * 1000);

    const record = RefreshToken.create({
      id: uuidv4(),
      userId: user.id,
      tokenHash,
      expiresAt,
      revokedAt: null,
      createdAt: now,
    });
    await this.refreshTokenRepo.save(record);

    return {
      accessToken,
      refreshToken: rawRefresh,
      expiresInSeconds: ACCESS_TOKEN_EXPIRES_SECONDS,
      refreshExpiresInSeconds: REFRESH_TOKEN_EXPIRES_SECONDS,
    };
  }
}
