import type { PlanTier } from "../../domain/models/User.js";

/** Redis-backed materialized view of `users.plan_tier`, read by the gateway (`tier:{userId}`). */
export interface ITierCache {
  setTier(userId: string, tier: PlanTier): Promise<void>;
  /** Used when a subscription enters "cancelling": the cache should stop being trusted once the paid period ends. */
  setTierWithExpiry(userId: string, tier: PlanTier, ttlSeconds: number): Promise<void>;
}
