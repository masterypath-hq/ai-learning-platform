import { jest } from "@jest/globals";
import { CreateCheckoutSessionAction } from "./CreateCheckoutSessionAction.js";
import type { IBillingProvider } from "../interfaces/IBillingProvider.js";
import type { SubscriptionProvider } from "@ai-learning-platform/shared";

function makeProvider(name: SubscriptionProvider, url: string): IBillingProvider {
  return {
    name,
    createCheckoutSession: jest.fn<IBillingProvider["createCheckoutSession"]>().mockResolvedValue({ url }),
    parseWebhook: jest.fn<IBillingProvider["parseWebhook"]>(),
  };
}

describe("CreateCheckoutSessionAction", () => {
  it("calls the Stripe provider and returns its checkout url when provider is stripe", async () => {
    const stripe = makeProvider("stripe", "https://checkout.stripe.com/session123");
    const paystack = makeProvider("paystack", "https://checkout.paystack.com/session456");
    const action = new CreateCheckoutSessionAction(
      { stripe, paystack },
      "https://app.example.com/billing/success",
      "https://app.example.com/billing/cancel"
    );

    const result = await action.execute("user-1", "learner@example.com", "stripe", "usd");

    expect(result).toEqual({ url: "https://checkout.stripe.com/session123" });
    expect(stripe.createCheckoutSession).toHaveBeenCalledWith({
      userId: "user-1",
      email: "learner@example.com",
      currency: "usd",
      successUrl: "https://app.example.com/billing/success",
      cancelUrl: "https://app.example.com/billing/cancel",
    });
    expect(paystack.createCheckoutSession).not.toHaveBeenCalled();
  });

  it("calls the Paystack provider and returns its checkout url when provider is paystack", async () => {
    const stripe = makeProvider("stripe", "https://checkout.stripe.com/session123");
    const paystack = makeProvider("paystack", "https://checkout.paystack.com/session456");
    const action = new CreateCheckoutSessionAction(
      { stripe, paystack },
      "https://app.example.com/billing/success",
      "https://app.example.com/billing/cancel"
    );

    const result = await action.execute("user-1", "learner@example.com", "paystack", "ngn");

    expect(result).toEqual({ url: "https://checkout.paystack.com/session456" });
    expect(paystack.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ currency: "ngn", userId: "user-1" })
    );
    expect(stripe.createCheckoutSession).not.toHaveBeenCalled();
  });
});
