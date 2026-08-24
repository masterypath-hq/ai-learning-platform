import type { UserProfileResponse } from "@ai-learning-platform/shared";
import type { IUserRepository } from "../interfaces/IUserRepository.js";
import type { IProfileCache } from "../interfaces/IProfileCache.js";
import type { ISubscriptionRepository } from "../interfaces/ISubscriptionRepository.js";
import type { ITierCache } from "../interfaces/ITierCache.js";
import type { IGetMeAction } from "../interfaces/IGetMeAction.js";

/** Loads profile with Redis cache (15 min TTL via IProfileCache). */
export class GetMeAction implements IGetMeAction {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly profileCache: IProfileCache,
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly tierCache: ITierCache
  ) {}

  async execute(userId: string): Promise<UserProfileResponse> {
    let profile = await this.loadProfile(userId);

    // No cron in this codebase for billing (matches progress-service's "badges
    // computed, no cron" pattern) — a lapsed Paystack cancellation self-heals here.
    if (profile.planTier === "pro") {
      const healed = await this.healLapsedCancellation(userId, profile);
      if (healed) profile = healed;
    }

    return profile;
  }

  private async loadProfile(userId: string): Promise<UserProfileResponse> {
    const cached = await this.profileCache.get(userId);
    if (cached) {
      return JSON.parse(cached) as UserProfileResponse;
    }

    const user = await this.userRepo.findById(userId);
    if (!user) throw new Error("USER_NOT_FOUND");

    const profile: UserProfileResponse = {
      userId: user.id,
      email: user.email,
      name: user.name,
      planTier: user.planTier,
      authProvider: user.authProvider,
    };

    await this.profileCache.setex(userId, this.profileCache.defaultTtlSeconds, JSON.stringify(profile));

    return profile;
  }

  private async healLapsedCancellation(
    userId: string,
    profile: UserProfileResponse
  ): Promise<UserProfileResponse | null> {
    const subscription = await this.subscriptionRepo.findByUserId(userId);
    if (!subscription || !subscription.hasLapsed()) return null;

    const user = await this.userRepo.findById(userId);
    if (!user) return null;

    await this.userRepo.save(user.withPlanTier("free"));
    await this.subscriptionRepo.upsert(subscription.withStatus("cancelled"));

    const healedProfile: UserProfileResponse = { ...profile, planTier: "free" };
    await this.profileCache.setex(userId, this.profileCache.defaultTtlSeconds, JSON.stringify(healedProfile));
    await this.tierCache.setTier(userId, "free");

    return healedProfile;
  }
}
