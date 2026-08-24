import { jest } from "@jest/globals";
import { HandleWebhookAction } from "./HandleWebhookAction.js";
import { Subscription } from "../../domain/models/Subscription.js";
import { User } from "../../domain/models/User.js";
import type { IBillingProvider, NormalizedBillingEvent } from "../interfaces/IBillingProvider.js";
import type { ISubscriptionRepository } from "../interfaces/ISubscriptionRepository.js";
import type { IProcessedWebhookEventRepository } from "../interfaces/IProcessedWebhookEventRepository.js";
import type { IUserRepository } from "../interfaces/IUserRepository.js";
import type { IProfileCache } from "../interfaces/IProfileCache.js";
import type { ITierCache } from "../interfaces/ITierCache.js";
import type { SubscriptionProvider } from "@ai-learning-platform/shared";

function makeUser(overrides: Partial<Parameters<typeof User.create>[0]> = {}) {
  return User.create({
    id: "user-1",
    email: "learner@example.com",
    passwordHash: "hash",
    name: "Learner",
    planTier: "free",
    createdAt: new Date(),
    emailVerifiedAt: null,
    authProvider: "local",
    googleId: null,
    githubId: null,
    ...overrides,
  });
}

function makeSubscription(overrides: Partial<Parameters<typeof Subscription.create>[0]> = {}) {
  return Subscription.create({
    id: "sub-1",
    userId: "user-1",
    provider: "stripe",
    status: "active",
    currency: "usd",
    stripeCustomerId: "cus_1",
    stripeSubscriptionId: "sub_1",
    paystackCustomerCode: null,
    paystackSubscriptionCode: null,
    paystackEmailToken: null,
    currentPeriodEnd: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function makeCheckoutEvent(overrides: Partial<NormalizedBillingEvent> = {}): NormalizedBillingEvent {
  return {
    type: "checkout_completed",
    provider: "stripe",
    providerEventId: "evt_1",
    userId: "user-1",
    customerId: "cus_1",
    subscriptionId: "sub_1",
    status: "active",
    currentPeriodEnd: null,
    currency: "usd",
    ...overrides,
  };
}

function makeProvider(events: NormalizedBillingEvent[]): IBillingProvider {
  return {
    name: "stripe",
    createCheckoutSession: jest.fn<IBillingProvider["createCheckoutSession"]>(),
    parseWebhook: jest.fn<IBillingProvider["parseWebhook"]>().mockReturnValue(events),
  };
}

function makeDeps(overrides: {
  provider?: IBillingProvider;
  subscriptionRepo?: Partial<ISubscriptionRepository>;
  processedEventsRepo?: Partial<IProcessedWebhookEventRepository>;
  userRepo?: Partial<IUserRepository>;
  profileCache?: Partial<IProfileCache>;
  tierCache?: Partial<ITierCache>;
} = {}) {
  const subscriptionRepo: ISubscriptionRepository = {
    findByUserId: jest.fn<ISubscriptionRepository["findByUserId"]>().mockResolvedValue(null),
    findByStripeCustomerId: jest.fn<ISubscriptionRepository["findByStripeCustomerId"]>().mockResolvedValue(null),
    findByStripeSubscriptionId: jest.fn<ISubscriptionRepository["findByStripeSubscriptionId"]>().mockResolvedValue(null),
    findByPaystackSubscriptionCode: jest
      .fn<ISubscriptionRepository["findByPaystackSubscriptionCode"]>()
      .mockResolvedValue(null),
    upsert: jest.fn<ISubscriptionRepository["upsert"]>().mockResolvedValue(undefined),
    ...overrides.subscriptionRepo,
  };

  const processedEvents = new Set<string>();
  const processedEventsRepo: IProcessedWebhookEventRepository = {
    hasProcessed: jest
      .fn<IProcessedWebhookEventRepository["hasProcessed"]>()
      .mockImplementation(async (provider, eventId) => processedEvents.has(`${provider}:${eventId}`)),
    markProcessed: jest
      .fn<IProcessedWebhookEventRepository["markProcessed"]>()
      .mockImplementation(async (provider, eventId) => {
        processedEvents.add(`${provider}:${eventId}`);
      }),
    ...overrides.processedEventsRepo,
  };

  const userRepo: IUserRepository = {
    save: jest.fn<IUserRepository["save"]>().mockResolvedValue(undefined),
    findByEmail: jest.fn<IUserRepository["findByEmail"]>().mockResolvedValue(null),
    findById: jest.fn<IUserRepository["findById"]>().mockResolvedValue(makeUser()),
    findByGoogleId: jest.fn<IUserRepository["findByGoogleId"]>().mockResolvedValue(null),
    findByGithubId: jest.fn<IUserRepository["findByGithubId"]>().mockResolvedValue(null),
    ...overrides.userRepo,
  };

  const profileCache: IProfileCache = {
    defaultTtlSeconds: 900,
    get: jest.fn<IProfileCache["get"]>().mockResolvedValue(null),
    setex: jest.fn<IProfileCache["setex"]>().mockResolvedValue(undefined),
    ...overrides.profileCache,
  };

  const tierCache: ITierCache = {
    setTier: jest.fn<ITierCache["setTier"]>().mockResolvedValue(undefined),
    setTierWithExpiry: jest.fn<ITierCache["setTierWithExpiry"]>().mockResolvedValue(undefined),
    ...overrides.tierCache,
  };

  const providers: Record<SubscriptionProvider, IBillingProvider> = {
    stripe: overrides.provider ?? makeProvider([]),
    paystack: makeProvider([]),
  };

  const action = new HandleWebhookAction(providers, subscriptionRepo, processedEventsRepo, userRepo, profileCache, tierCache);

  return { action, subscriptionRepo, processedEventsRepo, userRepo, profileCache, tierCache };
}

describe("HandleWebhookAction", () => {
  it("upgrades the user's tier and writes both caches on a new checkout-completed event", async () => {
    const event = makeCheckoutEvent();
    const provider = makeProvider([event]);
    const { action, subscriptionRepo, userRepo, profileCache, tierCache, processedEventsRepo } = makeDeps({ provider });

    await action.execute("stripe", Buffer.from("{}"), "sig");

    expect(subscriptionRepo.upsert).toHaveBeenCalledTimes(1);
    expect(userRepo.save).toHaveBeenCalledTimes(1);
    const savedUser = (userRepo.save as jest.Mock).mock.calls[0][0] as { planTier: string };
    expect(savedUser.planTier).toBe("pro");
    expect(profileCache.setex).toHaveBeenCalledTimes(1);
    expect(tierCache.setTier).toHaveBeenCalledWith("user-1", "pro");
    expect(processedEventsRepo.markProcessed).toHaveBeenCalledWith("stripe", "evt_1");
  });

  it("does not reprocess a replayed event with the same providerEventId", async () => {
    const event = makeCheckoutEvent();
    const provider = makeProvider([event]);
    const { action, subscriptionRepo, processedEventsRepo } = makeDeps({ provider });

    await action.execute("stripe", Buffer.from("{}"), "sig");
    await action.execute("stripe", Buffer.from("{}"), "sig");

    expect(subscriptionRepo.upsert).toHaveBeenCalledTimes(1);
    expect(processedEventsRepo.markProcessed).toHaveBeenCalledTimes(1);
  });

  it("downgrades the user's tier to free on a subscription-cancelled event", async () => {
    const event = makeCheckoutEvent({
      type: "subscription_cancelled",
      providerEventId: "evt_cancel",
      status: "cancelled",
    });
    const provider = makeProvider([event]);
    const { action, userRepo, tierCache } = makeDeps({
      provider,
      userRepo: { findById: jest.fn<IUserRepository["findById"]>().mockResolvedValue(makeUser({ planTier: "pro" })) },
    });

    await action.execute("stripe", Buffer.from("{}"), "sig");

    const savedUser = (userRepo.save as jest.Mock).mock.calls[0][0] as { planTier: string };
    expect(savedUser.planTier).toBe("free");
    expect(tierCache.setTier).toHaveBeenCalledWith("user-1", "free");
  });

  it("does not throw and still marks the event processed when no user can be resolved", async () => {
    const event = makeCheckoutEvent({ userId: null, customerId: "cus_unknown", subscriptionId: "sub_unknown" });
    const provider = makeProvider([event]);
    const { action, subscriptionRepo, processedEventsRepo } = makeDeps({ provider });

    await expect(action.execute("stripe", Buffer.from("{}"), "sig")).resolves.toBeUndefined();

    expect(subscriptionRepo.upsert).not.toHaveBeenCalled();
    expect(processedEventsRepo.markProcessed).toHaveBeenCalledWith("stripe", "evt_1");
  });

  it("resolves the user via the stored subscription when the event carries no userId", async () => {
    const event = makeCheckoutEvent({ type: "subscription_updated", userId: null, subscriptionId: "sub_1" });
    const provider = makeProvider([event]);
    const existing = makeSubscription();
    const { action, subscriptionRepo } = makeDeps({
      provider,
      subscriptionRepo: {
        findByStripeSubscriptionId: jest
          .fn<ISubscriptionRepository["findByStripeSubscriptionId"]>()
          .mockResolvedValue(existing),
      },
    });

    await action.execute("stripe", Buffer.from("{}"), "sig");

    expect(subscriptionRepo.upsert).toHaveBeenCalledTimes(1);
    const upserted = (subscriptionRepo.upsert as jest.Mock).mock.calls[0][0] as { userId: string };
    expect(upserted.userId).toBe("user-1");
  });
});
