import type { SubscriptionProvider, Currency } from "@ai-learning-platform/shared";

export interface CreateCheckoutSessionParams {
  userId: string;
  email: string;
  currency: Currency;
  successUrl: string;
  cancelUrl: string;
}

export type NormalizedBillingEventType =
  | "checkout_completed"
  | "subscription_updated"
  | "subscription_cancelled";

/**
 * Provider-agnostic shape a webhook payload is parsed into. `userId` is only
 * populated when the provider echoes it back directly (e.g. Stripe's
 * `client_reference_id`); otherwise the caller resolves it via
 * customer/subscription id lookup.
 */
export interface NormalizedBillingEvent {
  type: NormalizedBillingEventType;
  provider: SubscriptionProvider;
  providerEventId: string;
  userId: string | null;
  customerId: string | null;
  subscriptionId: string | null;
  emailToken?: string | null;
  status: "active" | "past_due" | "cancelled";
  currentPeriodEnd: string | null;
  currency: Currency | null;
}

/** Port: a payment provider (Stripe or Paystack). (SOLID: D, I, O — new providers plug in without touching callers.) */
export interface IBillingProvider {
  readonly name: SubscriptionProvider;
  createCheckoutSession(params: CreateCheckoutSessionParams): Promise<{ url: string }>;
  /** Only Stripe supports a hosted customer portal. */
  createPortalSession?(customerId: string, returnUrl: string): Promise<{ url: string }>;
  /** Only Paystack — no hosted portal, so cancellation is an in-app action. */
  cancelSubscription?(subscriptionCode: string, emailToken: string): Promise<void>;
  /** Verifies the signature and parses the raw payload. Throws on an invalid signature. */
  parseWebhook(rawBody: Buffer, signatureHeader: string): NormalizedBillingEvent[];
}
