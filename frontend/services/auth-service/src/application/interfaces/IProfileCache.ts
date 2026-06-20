/** Redis cache for GET /me (15 min TTL). */
export interface IProfileCache {
  readonly defaultTtlSeconds: number;
  get(userId: string): Promise<string | null>;
  setex(userId: string, ttlSeconds: number, json: string): Promise<void>;
}
