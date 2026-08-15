import type { SubscriptionStatusResponse } from "@ai-learning-platform/shared";

export interface IGetSubscriptionStatusAction {
  execute(userId: string): Promise<SubscriptionStatusResponse>;
}
