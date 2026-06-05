import type { ConnectionOptions } from "bullmq";

/** BullMQ must own Redis connections (do not pass ioredis instances from the app). */
export function createBullmqConnection(redisUrl: string): ConnectionOptions {
  return {
    url: redisUrl,
    maxRetriesPerRequest: null,
  };
}
