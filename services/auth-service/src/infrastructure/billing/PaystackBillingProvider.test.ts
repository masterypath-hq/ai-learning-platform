import { createHmac } from "node:crypto";
import { PaystackBillingProvider } from "./PaystackBillingProvider.js";

const SECRET = "sk_test_secret";

function sign(rawBody: Buffer): string {
  return createHmac("sha512", SECRET).update(rawBody).digest("hex");
}

describe("PaystackBillingProvider", () => {
  const provider = new PaystackBillingProvider(SECRET, "PLN_123", "https://app.example.com/billing/success");

  it("parses a subscription.create webhook with a valid signature", () => {
    const payload = {
      event: "subscription.create",
      data: {
        subscription_code: "SUB_1",
        email_token: "token-1",
        customer: { customer_code: "CUS_1", email: "learner@example.com" },
        plan: { plan_code: "PLN_123" },
        next_payment_date: "2026-09-15T00:00:00.000Z",
        metadata: { userId: "user-1" },
      },
    };
    const rawBody = Buffer.from(JSON.stringify(payload));
    const signature = sign(rawBody);

    const events = provider.parseWebhook(rawBody, signature);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "checkout_completed",
      provider: "paystack",
      userId: "user-1",
      customerId: "CUS_1",
      subscriptionId: "SUB_1",
      emailToken: "token-1",
      status: "active",
      currency: "ngn",
    });
  });

  it("parses a subscription.disable webhook as a cancellation", () => {
    const payload = {
      event: "subscription.disable",
      data: {
        subscription_code: "SUB_1",
        email_token: "token-1",
        customer: { customer_code: "CUS_1", email: "learner@example.com" },
        metadata: { userId: "user-1" },
      },
    };
    const rawBody = Buffer.from(JSON.stringify(payload));
    const signature = sign(rawBody);

    const events = provider.parseWebhook(rawBody, signature);

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("subscription_cancelled");
    expect(events[0].status).toBe("cancelled");
  });

  it("rejects a payload whose signature does not match", () => {
    const payload = { event: "subscription.create", data: {} };
    const rawBody = Buffer.from(JSON.stringify(payload));

    expect(() => provider.parseWebhook(rawBody, "not-a-real-signature")).toThrow("PAYSTACK_INVALID_SIGNATURE");
  });

  it("rejects a tampered payload even if a signature is present", () => {
    const originalPayload = { event: "subscription.create", data: { subscription_code: "SUB_1" } };
    const originalRawBody = Buffer.from(JSON.stringify(originalPayload));
    const validSignatureForOriginal = sign(originalRawBody);

    const tamperedPayload = { event: "subscription.create", data: { subscription_code: "SUB_EVIL" } };
    const tamperedRawBody = Buffer.from(JSON.stringify(tamperedPayload));

    expect(() => provider.parseWebhook(tamperedRawBody, validSignatureForOriginal)).toThrow(
      "PAYSTACK_INVALID_SIGNATURE"
    );
  });

  it("produces a stable idempotency key for a byte-identical replayed payload", () => {
    const payload = { event: "subscription.create", data: { subscription_code: "SUB_1", email_token: "t", customer: { customer_code: "CUS_1" } } };
    const rawBody = Buffer.from(JSON.stringify(payload));
    const signature = sign(rawBody);

    const first = provider.parseWebhook(rawBody, signature);
    const second = provider.parseWebhook(Buffer.from(rawBody), signature);

    expect(first[0].providerEventId).toBe(second[0].providerEventId);
  });
});
