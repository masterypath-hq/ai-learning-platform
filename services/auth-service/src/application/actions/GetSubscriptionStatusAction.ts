import type { SubscriptionStatusResponse } from "@ai-learning-platform/shared";
import type { ISubscriptionRepository } from "../interfaces/ISubscriptionRepository.js";
import type { IUserRepository } from "../interfaces/IUserRepository.js";
import type { IGetSubscriptionStatusAction } from "../interfaces/IGetSubscriptionStatusAction.js";

export class GetSubscriptionStatusAction implements IGetSubscriptionStatusAction {
  constructor(
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly userRepo: IUserRepository
  ) {}

  async execute(userId: string): Promise<SubscriptionStatusResponse> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new Error("USER_NOT_FOUND");

    const subscription = await this.subscriptionRepo.findByUserId(userId);

    return {
      tier: user.planTier === "pro" ? "pro" : "free",
      provider: subscription?.provider ?? null,
      status: subscription?.status ?? null,
      currency: subscription?.currency ?? null,
      currentPeriodEnd: subscription?.currentPeriodEnd ? subscription.currentPeriodEnd.toISOString() : null,
      cancelling: subscription?.status === "cancelling",
    };
  }
}
