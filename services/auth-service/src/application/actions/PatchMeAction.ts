import type { UserProfileResponse } from "@ai-learning-platform/shared";
import type { IUserRepository } from "../interfaces/IUserRepository.js";
import type { IProfileCache } from "../interfaces/IProfileCache.js";
import type { IPatchMeAction } from "../interfaces/IPatchMeAction.js";

/** Updates the mutable profile fields and refreshes the Redis profile cache. */
export class PatchMeAction implements IPatchMeAction {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly profileCache: IProfileCache
  ) {}

  async execute(userId: string, updates: { name?: string }): Promise<UserProfileResponse> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new Error("USER_NOT_FOUND");

    const updated = updates.name !== undefined ? user.withName(updates.name) : user;
    await this.userRepo.save(updated);

    const profile: UserProfileResponse = {
      userId: updated.id,
      email: updated.email,
      name: updated.name,
      planTier: updated.planTier,
      authProvider: updated.authProvider,
    };

    await this.profileCache.setex(
      userId,
      this.profileCache.defaultTtlSeconds,
      JSON.stringify(profile)
    );

    return profile;
  }
}
