import type { Subscription } from "../../domain/models/Subscription.js";

/** Port: subscription persistence. (SOLID: D, I.) */
export interface ISubscriptionRepository {
  findByUserId(userId: string): Promise<Subscription | null>;
  findByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | null>;
  findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null>;
  findByPaystackSubscriptionCode(paystackSubscriptionCode: string): Promise<Subscription | null>;
  /** Upsert keyed by userId (one subscription per user). */
  upsert(subscription: Subscription): Promise<void>;
}
