import type { Redis } from "ioredis";
import { progressEventChannel, type ProgressEvent } from "@ai-learning-platform/shared";
import type { IProgressEventPublisher } from "../../application/interfaces/IProgressEventPublisher.js";

export class RedisProgressEventPublisher implements IProgressEventPublisher {
  constructor(private readonly redis: Redis) {}

  async publish(event: ProgressEvent): Promise<void> {
    await this.redis.publish(progressEventChannel(event.activityType), JSON.stringify(event));
  }
}
