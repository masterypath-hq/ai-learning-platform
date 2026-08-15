import type { ISubscriptionRepository } from "../interfaces/ISubscriptionRepository.js";
import type { IBillingProvider } from "../interfaces/IBillingProvider.js";
import type { ITierCache } from "../interfaces/ITierCache.js";
import type { ICancelSubscriptionAction } from "../interfaces/ICancelSubscriptionAction.js";

/**
 * Paystack has no hosted customer portal, so cancellation is an in-app action.
 * Keeps Pro access until `current_period_end` (matches Stripe's default
 * cancel-at-period-end behavior) rather than downgrading immediately.
 */
export class CancelSubscriptionAction implements ICancelSubscriptionAction {
  constructor(
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly paystackProvider: IBillingProvider,
    private readonly tierCache: ITierCache
  ) {}

  async execute(userId: string): Promise<{ message: string }> {
    const sub = await this.subscriptionRepo.findByUserId(userId);
    if (!sub) throw new Error("NO_ACTIVE_SUBSCRIPTION");
    if (sub.provider !== "paystack") throw new Error("CANCEL_NOT_SUPPORTED_USE_PORTAL");
    if (!sub.paystackSubscriptionCode || !sub.paystackEmailToken || !this.paystackProvider.cancelSubscription) {
      throw new Error("SUBSCRIPTION_MISSING_PAYSTACK_IDS");
    }

    await this.paystackProvider.cancelSubscription(sub.paystackSubscriptionCode, sub.paystackEmailToken);

    const updated = sub.withStatus("cancelling");
    await this.subscriptionRepo.upsert(updated);

    if (updated.currentPeriodEnd) {
      const ttlSeconds = Math.max(1, Math.floor((updated.currentPeriodEnd.getTime() - Date.now()) / 1000));
      await this.tierCache.setTierWithExpiry(userId, "pro", ttlSeconds);
    }

    return {
      message: "Your subscription will not renew. You'll keep Pro access until the end of your current billing period.",
    };
  }
}
