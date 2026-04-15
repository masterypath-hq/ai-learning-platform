import type { UserProfileResponse } from "@ai-learning-platform/shared";

export interface IGetMeAction {
  execute(userId: string): Promise<UserProfileResponse>;
}
