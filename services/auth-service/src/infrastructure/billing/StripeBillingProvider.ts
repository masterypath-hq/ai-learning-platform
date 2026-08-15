import Stripe from "stripe";
import type { Currency } from "@ai-learning-platform/shared";
import type {
  CreateCheckoutSessionParams,
  IBillingProvider,
  NormalizedBillingEvent,
} from "../../application/interfaces/IBillingProvider.js";

export class StripeBillingProvider implements IBillingProvider {
  readonly name = "stripe" as const;

  constructor(
    private readonly stripe: Stripe,
    private readonly priceIdPro: string,
    private readonly webhookSecret: string
  ) {}

  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<{ url: string }> {
    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: this.priceIdPro, quantity: 1 }],
      customer_email: params.email,
      client_reference_id: params.userId,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: { userId: params.userId },
    });
    if (!session.url) throw new Error("STRIPE_CHECKOUT_SESSION_MISSING_URL");
    return { url: session.url };
  }

  async createPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  }

  parseWebhook(rawBody: Buffer, signatureHeader: string): NormalizedBillingEvent[] {
    const event = this.stripe.webhooks.constructEvent(rawBody, signatureHeader, this.webhookSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        return [
          {
            type: "checkout_completed",
            provider: "stripe",
            providerEventId: event.id,
            userId: session.client_reference_id ?? (session.metadata?.userId ?? null),
            customerId: typeof session.customer === "string" ? session.customer : (session.customer?.id ?? null),
            subscriptionId:
              typeof session.subscription === "string" ? session.subscription : (session.subscription?.id ?? null),
            status: "active",
            currentPeriodEnd: null,
            currency: (session.currency as Currency | null) ?? null,
          },
        ];
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const periodEndSeconds = sub.items.data[0]?.current_period_end;
        return [
          {
            type: "subscription_updated",
            provider: "stripe",
            providerEventId: event.id,
            userId: sub.metadata?.userId ?? null,
            customerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
            subscriptionId: sub.id,
            status: sub.status === "past_due" ? "past_due" : "active",
            currentPeriodEnd: periodEndSeconds ? new Date(periodEndSeconds * 1000).toISOString() : null,
            currency: null,
          },
        ];
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        return [
          {
            type: "subscription_cancelled",
            provider: "stripe",
            providerEventId: event.id,
            userId: sub.metadata?.userId ?? null,
            customerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
            subscriptionId: sub.id,
            status: "cancelled",
            currentPeriodEnd: null,
            currency: null,
          },
        ];
      }
      default:
        return [];
    }
  }
}
