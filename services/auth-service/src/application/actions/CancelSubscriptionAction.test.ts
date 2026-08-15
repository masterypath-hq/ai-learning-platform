import { jest } from "@jest/globals";
import { CancelSubscriptionAction } from "./CancelSubscriptionAction.js";
import { Subscription } from "../../domain/models/Subscription.js";
import type { ISubscriptionRepository } from "../interfaces/ISubscriptionRepository.js";
import type { IBillingProvider } from "../interfaces/IBillingProvider.js";
import type { ITierCache } from "../interfaces/ITierCache.js";

function makeSubscription(overrides: Partial<Parameters<typeof Subscription.create>[0]> = {}) {
  return Subscription.create({
    id: "sub-1",
    userId: "user-1",
    provider: "paystack",
    status: "active",
    currency: "ngn",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    paystackCustomerCode: "CUS_1",
    paystackSubscriptionCode: "SUB_1",
    paystackEmailToken: "token-1",
    currentPeriodEnd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function makeDeps(overrides: { subscription?: Subscription | null } = {}) {
  const subscriptionRepo: ISubscriptionRepository = {
    findByUserId: jest
      .fn<ISubscriptionRepository["findByUserId"]>()
      .mockResolvedValue(overrides.subscription === undefined ? makeSubscription() : overrides.subscription),
    findByStripeCustomerId: jest.fn<ISubscriptionRepository["findByStripeCustomerId"]>().mockResolvedValue(null),
    findByStripeSubscriptionId: jest.fn<ISubscriptionRepository["findByStripeSubscriptionId"]>().mockResolvedValue(null),
    findByPaystackSubscriptionCode: jest
      .fn<ISubscriptionRepository["findByPaystackSubscriptionCode"]>()
      .mockResolvedValue(null),
    upsert: jest.fn<ISubscriptionRepository["upsert"]>().mockResolvedValue(undefined),
  };

  const paystackProvider: IBillingProvider = {
    name: "paystack",
    createCheckoutSession: jest.fn<IBillingProvider["createCheckoutSession"]>(),
    parseWebhook: jest.fn<IBillingProvider["parseWebhook"]>(),
    cancelSubscription: jest.fn<NonNullable<IBillingProvider["cancelSubscription"]>>().mockResolvedValue(undefined),
  };

  const tierCache: ITierCache = {
    setTier: jest.fn<ITierCache["setTier"]>().mockResolvedValue(undefined),
    setTierWithExpiry: jest.fn<ITierCache["setTierWithExpiry"]>().mockResolvedValue(undefined),
  };

  const action = new CancelSubscriptionAction(subscriptionRepo, paystackProvider, tierCache);

  return { action, subscriptionRepo, paystackProvider, tierCache };
}

describe("CancelSubscriptionAction", () => {
  it("rejects when the user's subscription is on Stripe (must use the portal instead)", async () => {
    const { action } = makeDeps({ subscription: makeSubscription({ provider: "stripe" }) });

    await expect(action.execute("user-1")).rejects.toThrow("CANCEL_NOT_SUPPORTED_USE_PORTAL");
  });

  it("rejects when the user has no subscription at all", async () => {
    const { action } = makeDeps({ subscription: null });

    await expect(action.execute("user-1")).rejects.toThrow("NO_ACTIVE_SUBSCRIPTION");
  });

  it("calls Paystack's disable API and marks the subscription cancelling (keeps Pro until period end)", async () => {
    const { action, paystackProvider, subscriptionRepo, tierCache } = makeDeps();

    const result = await action.execute("user-1");

    expect(paystackProvider.cancelSubscription).toHaveBeenCalledWith("SUB_1", "token-1");
    expect(subscriptionRepo.upsert).toHaveBeenCalledTimes(1);
    const upserted = (subscriptionRepo.upsert as jest.Mock).mock.calls[0][0] as { status: string };
    expect(upserted.status).toBe("cancelling");
    expect(tierCache.setTierWithExpiry).toHaveBeenCalledWith("user-1", "pro", expect.any(Number));
    expect(result.message).toMatch(/keep pro access/i);
  });
});
