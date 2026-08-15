import type { UserProfileResponse } from "@ai-learning-platform/shared";

export interface IPatchMeAction {
  execute(userId: string, updates: { name?: string }): Promise<UserProfileResponse>;
}
