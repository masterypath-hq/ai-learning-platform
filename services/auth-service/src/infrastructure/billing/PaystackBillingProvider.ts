import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  CreateCheckoutSessionParams,
  IBillingProvider,
  NormalizedBillingEvent,
} from "../../application/interfaces/IBillingProvider.js";

const PAYSTACK_API_BASE = "https://api.paystack.co";

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data?: { authorization_url: string; access_code: string; reference: string };
}

interface PaystackSubscriptionCreateEvent {
  event: "subscription.create";
  data: {
    subscription_code: string;
    email_token: string;
    customer: { customer_code: string; email: string };
    plan: { plan_code: string };
    next_payment_date: string | null;
    metadata?: { userId?: string } | null;
  };
}

interface PaystackSubscriptionDisableEvent {
  event: "subscription.disable" | "subscription.not_renew";
  data: {
    subscription_code: string;
    email_token: string;
    customer: { customer_code: string; email: string };
    metadata?: { userId?: string } | null;
  };
}

type PaystackWebhookEvent = PaystackSubscriptionCreateEvent | PaystackSubscriptionDisableEvent | { event: string; data: unknown };

/**
 * Paystack has no official Node SDK — calls its REST API directly via `fetch`.
 * MVP scope only handles `subscription.create`/`subscription.disable`
 * (see plan judgment call: monthly Pro only, no invoice/charge event handling).
 */
export class PaystackBillingProvider implements IBillingProvider {
  readonly name = "paystack" as const;

  constructor(
    private readonly secretKey: string,
    private readonly planCode: string,
    private readonly callbackUrl: string
  ) {}

  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<{ url: string }> {
    const response = await fetch(`${PAYSTACK_API_BASE}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: params.email,
        plan: this.planCode,
        callback_url: params.successUrl ?? this.callbackUrl,
        metadata: { userId: params.userId },
      }),
    });
    const body = (await response.json()) as PaystackInitializeResponse;
    if (!response.ok || !body.status || !body.data) {
      throw new Error(`PAYSTACK_INIT_FAILED: ${body.message ?? response.statusText}`);
    }
    return { url: body.data.authorization_url };
  }

  async cancelSubscription(subscriptionCode: string, emailToken: string): Promise<void> {
    const response = await fetch(`${PAYSTACK_API_BASE}/subscription/disable`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code: subscriptionCode, token: emailToken }),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new Error(`PAYSTACK_DISABLE_FAILED: ${body?.message ?? response.statusText}`);
    }
  }

  /** Verifies HMAC-SHA512 of the raw body against `x-paystack-signature`. */
  parseWebhook(rawBody: Buffer, signatureHeader: string): NormalizedBillingEvent[] {
    const expected = createHmac("sha512", this.secretKey).update(rawBody).digest("hex");
    const expectedBuf = Buffer.from(expected, "utf8");
    const actualBuf = Buffer.from(signatureHeader ?? "", "utf8");
    if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
      throw new Error("PAYSTACK_INVALID_SIGNATURE");
    }

    const event = JSON.parse(rawBody.toString("utf8")) as PaystackWebhookEvent;
    // Unlike Stripe, Paystack payloads carry no unique event id — a retry resends the
    // identical body, so hashing the raw payload is a stable idempotency key.
    const providerEventId = `${event.event}:${hashPayload(rawBody)}`;

    if (event.event === "subscription.create") {
      const data = (event as PaystackSubscriptionCreateEvent).data;
      return [
        {
          type: "checkout_completed",
          provider: "paystack",
          providerEventId,
          userId: data.metadata?.userId ?? null,
          customerId: data.customer.customer_code,
          subscriptionId: data.subscription_code,
          emailToken: data.email_token,
          status: "active",
          currentPeriodEnd: data.next_payment_date,
          currency: "ngn",
        },
      ];
    }

    if (event.event === "subscription.disable" || event.event === "subscription.not_renew") {
      const data = (event as PaystackSubscriptionDisableEvent).data;
      return [
        {
          type: "subscription_cancelled",
          provider: "paystack",
          providerEventId,
          userId: data.metadata?.userId ?? null,
          customerId: data.customer.customer_code,
          subscriptionId: data.subscription_code,
          emailToken: data.email_token,
          status: "cancelled",
          currentPeriodEnd: null,
          currency: "ngn",
        },
      ];
    }

    return [];
  }
}

function hashPayload(rawBody: Buffer): string {
  return createHmac("sha256", "paystack-event-id").update(rawBody).digest("hex").slice(0, 24);
}
