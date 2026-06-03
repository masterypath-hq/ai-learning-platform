import type { Redis } from "ioredis";
import type { IGoogleStateStore } from "../../application/interfaces/IGoogleStateStore.js";

const STATE_TTL_SECONDS = 600; 

export class RedisGoogleStateStore implements IGoogleStateStore {
  constructor(private readonly redis: Redis) {}

  async save(state: string): Promise<void> {
    await this.redis.set(`oauth:state:${state}`, "1", "EX", STATE_TTL_SECONDS);
  }

  async consume(state: string): Promise<boolean> {
    const deleted = await this.redis.del(`oauth:state:${state}`);
    return deleted === 1;
  }
}
