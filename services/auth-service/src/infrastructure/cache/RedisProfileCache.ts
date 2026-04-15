import { Redis } from "ioredis";
import type { IProfileCache } from "../../application/interfaces/IProfileCache.js";

const TTL_SECONDS = 900;

export class RedisProfileCache implements IProfileCache {
  constructor(private readonly redis: Redis) {}

  private key(userId: string): string {
    return `user:${userId}:profile`;
  }

  async get(userId: string): Promise<string | null> {
    return this.redis.get(this.key(userId));
  }

  async setex(userId: string, ttlSeconds: number, json: string): Promise<void> {
    await this.redis.setex(this.key(userId), ttlSeconds, json);
  }

  get defaultTtlSeconds(): number {
    return TTL_SECONDS;
  }
}

