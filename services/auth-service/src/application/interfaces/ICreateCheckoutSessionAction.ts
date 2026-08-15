import type { SubscriptionProvider, Currency } from "@ai-learning-platform/shared";

export interface ICreateCheckoutSessionAction {
  execute(userId: string, email: string, provider: SubscriptionProvider, currency: Currency): Promise<{ url: string }>;
}
