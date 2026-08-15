import type { Redis } from "ioredis";
import type { ChatStreamEvent, IChatStreamPublisher } from "../../application/interfaces/IChatStreamPublisher.js";

export class RedisChatStreamPublisher implements IChatStreamPublisher {
  constructor(private readonly redis: Redis) {}

  async publish(sessionId: string, event: ChatStreamEvent): Promise<void> {
    await this.redis.publish(`chat:${sessionId}`, JSON.stringify(event));
  }
}
