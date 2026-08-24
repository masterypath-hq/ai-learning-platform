import type { SubscriptionProvider, Currency } from "@ai-learning-platform/shared";
import type { IBillingProvider } from "../interfaces/IBillingProvider.js";
import type { ICreateCheckoutSessionAction } from "../interfaces/ICreateCheckoutSessionAction.js";

export class CreateCheckoutSessionAction implements ICreateCheckoutSessionAction {
  constructor(
    private readonly providers: Record<SubscriptionProvider, IBillingProvider>,
    private readonly successUrl: string,
    private readonly cancelUrl: string
  ) {}

  async execute(userId: string, email: string, provider: SubscriptionProvider, currency: Currency): Promise<{ url: string }> {
    const billingProvider = this.providers[provider];
    return billingProvider.createCheckoutSession({
      userId,
      email,
      currency,
      successUrl: this.successUrl,
      cancelUrl: this.cancelUrl,
    });
  }
}
