import type { Redis } from "ioredis";
import type { ITierCache } from "../../application/interfaces/ITierCache.js";
import type { PlanTier } from "../../domain/models/User.js";

export class RedisTierCache implements ITierCache {
  constructor(private readonly redis: Redis) {}

  private key(userId: string): string {
    return `tier:${userId}`;
  }

  async setTier(userId: string, tier: PlanTier): Promise<void> {
    await this.redis.set(this.key(userId), tier);
  }

  async setTierWithExpiry(userId: string, tier: PlanTier, ttlSeconds: number): Promise<void> {
    await this.redis.set(this.key(userId), tier, "EX", Math.max(1, ttlSeconds));
  }
}
