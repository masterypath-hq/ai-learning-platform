import type { Redis } from "ioredis";
import type { IGithubStateStore } from "../../application/interfaces/IGithubStateStore.js";

const STATE_TTL_SECONDS = 600;

export class RedisGithubStateStore implements IGithubStateStore {
  constructor(private readonly redis: Redis) {}

  async save(state: string): Promise<void> {
    await this.redis.set(`oauth:github:state:${state}`, "1", "EX", STATE_TTL_SECONDS);
  }

  async consume(state: string): Promise<boolean> {
    const deleted = await this.redis.del(`oauth:github:state:${state}`);
    return deleted === 1;
  }
}
