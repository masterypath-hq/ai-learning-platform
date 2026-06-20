import type { User } from "../../domain/models/User.js";

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  refreshExpiresInSeconds: number;
}

/** Issues access + opaque refresh token pair. (ISP — single responsibility.) */
export interface ISessionTokensIssuer {
  issueForUser(user: User): Promise<SessionTokens>;
}
