export interface TokenPayload {
  userId: string;
  email: string;
}

export interface ITokenService {
  signAccessToken(payload: TokenPayload, expiresInSeconds: number): Promise<string>;
  verifyAccessToken(token: string): Promise<TokenPayload | null>;
}
