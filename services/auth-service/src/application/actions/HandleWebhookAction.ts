import { v4 as uuidv4 } from "uuid";
import type { SubscriptionProvider } from "@ai-learning-platform/shared";
import type { UserProfileResponse } from "@ai-learning-platform/shared";
import { Subscription } from "../../domain/models/Subscription.js";
import type { PlanTier } from "../../domain/models/User.js";
import type { IBillingProvider, NormalizedBillingEvent } from "../interfaces/IBillingProvider.js";
import type { ISubscriptionRepository } from "../interfaces/ISubscriptionRepository.js";
import type { IProcessedWebhookEventRepository } from "../interfaces/IProcessedWebhookEventRepository.js";
import type { IUserRepository } from "../interfaces/IUserRepository.js";
import type { IProfileCache } from "../interfaces/IProfileCache.js";
import type { ITierCache } from "../interfaces/ITierCache.js";
import type { IHandleWebhookAction } from "../interfaces/IHandleWebhookAction.js";

/**
 * Idempotent webhook handler. The `(provider, event_id)` unique constraint on
 * `processed_webhook_events` is the real concurrency guard — the `hasProcessed`
 * pre-check just avoids redundant work on the common case (a clean retry).
 */
export class HandleWebhookAction implements IHandleWebhookAction {
  constructor(
    private readonly providers: Record<SubscriptionProvider, IBillingProvider>,
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly processedEventsRepo: IProcessedWebhookEventRepository,
    private readonly userRepo: IUserRepository,
    private readonly profileCache: IProfileCache,
    private readonly tierCache: ITierCache
  ) {}

  async execute(provider: SubscriptionProvider, rawBody: Buffer, signatureHeader: string): Promise<void> {
    const events = this.providers[provider].parseWebhook(rawBody, signatureHeader);

    for (const event of events) {
      await this.applyEvent(event);
    }
  }

  private async applyEvent(event: NormalizedBillingEvent): Promise<void> {
    const alreadyProcessed = await this.processedEventsRepo.hasProcessed(event.provider, event.providerEventId);
    if (alreadyProcessed) return;

    const resolvedUserId = event.userId ?? (await this.resolveUserId(event));
    if (!resolvedUserId) {
      console.warn(
        `[HandleWebhookAction] Could not resolve a user for ${event.provider} event ${event.providerEventId} — skipping.`
      );
      await this.processedEventsRepo.markProcessed(event.provider, event.providerEventId);
      return;
    }

    const existing = await this.subscriptionRepo.findByUserId(resolvedUserId);
    const now = new Date();
    const isStripe = event.provider === "stripe";

    const subscription = Subscription.create({
      id: existing?.id ?? uuidv4(),
      userId: resolvedUserId,
      provider: event.provider,
      status: event.status === "cancelled" ? "cancelled" : event.status,
      currency: event.currency ?? existing?.currency ?? "usd",
      stripeCustomerId: isStripe ? (event.customerId ?? existing?.stripeCustomerId ?? null) : (existing?.stripeCustomerId ?? null),
      stripeSubscriptionId: isStripe
        ? (event.subscriptionId ?? existing?.stripeSubscriptionId ?? null)
        : (existing?.stripeSubscriptionId ?? null),
      paystackCustomerCode: isStripe
        ? (existing?.paystackCustomerCode ?? null)
        : (event.customerId ?? existing?.paystackCustomerCode ?? null),
      paystackSubscriptionCode: isStripe
        ? (existing?.paystackSubscriptionCode ?? null)
        : (event.subscriptionId ?? existing?.paystackSubscriptionCode ?? null),
      paystackEmailToken: isStripe
        ? (existing?.paystackEmailToken ?? null)
        : (event.emailToken ?? existing?.paystackEmailToken ?? null),
      currentPeriodEnd: event.currentPeriodEnd ? new Date(event.currentPeriodEnd) : (existing?.currentPeriodEnd ?? null),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
    await this.subscriptionRepo.upsert(subscription);

    const newTier: PlanTier = event.type === "subscription_cancelled" ? "free" : "pro";
    const user = await this.userRepo.findById(resolvedUserId);
    if (user) {
      const updatedUser = user.withPlanTier(newTier);
      await this.userRepo.save(updatedUser);

      const profile: UserProfileResponse = {
        userId: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        planTier: updatedUser.planTier,
        authProvider: updatedUser.authProvider,
      };
      await this.profileCache.setex(resolvedUserId, this.profileCache.defaultTtlSeconds, JSON.stringify(profile));
    }
    await this.tierCache.setTier(resolvedUserId, newTier);

    await this.processedEventsRepo.markProcessed(event.provider, event.providerEventId);
  }

  private async resolveUserId(event: NormalizedBillingEvent): Promise<string | null> {
    if (event.subscriptionId) {
      const bySubscription =
        event.provider === "stripe"
          ? await this.subscriptionRepo.findByStripeSubscriptionId(event.subscriptionId)
          : await this.subscriptionRepo.findByPaystackSubscriptionCode(event.subscriptionId);
      if (bySubscription) return bySubscription.userId;
    }
    if (event.customerId && event.provider === "stripe") {
      const byCustomer = await this.subscriptionRepo.findByStripeCustomerId(event.customerId);
      if (byCustomer) return byCustomer.userId;
    }
    return null;
  }
}
