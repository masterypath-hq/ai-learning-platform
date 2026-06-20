import type { UserProfileResponse } from "@ai-learning-platform/shared";
import type { IUserRepository } from "../interfaces/IUserRepository.js";
import type { IProfileCache } from "../interfaces/IProfileCache.js";
import type { IGetMeAction } from "../interfaces/IGetMeAction.js";

/** Loads profile with Redis cache (15 min TTL via IProfileCache). */
export class GetMeAction implements IGetMeAction {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly profileCache: IProfileCache
  ) {}

  async execute(userId: string): Promise<UserProfileResponse> {
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

    await this.profileCache.setex(
      userId,
      this.profileCache.defaultTtlSeconds,
      JSON.stringify(profile)
    );

    return profile;
  }
}
