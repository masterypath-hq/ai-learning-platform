import type { RefreshTokensResponse } from "@ai-learning-platform/shared";

export interface IRefreshTokensAction {
  execute(refreshToken: string): Promise<RefreshTokensResponse>;
}
