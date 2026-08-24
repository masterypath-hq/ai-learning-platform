import { Redis } from "ioredis";

let client: Redis | null = null;

export type { Redis as RedisClient };

export function getRedisClient(url: string): Redis {
  if (client) return client;
  client = new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: true });
  client.on("error", (err: Error) => {
    console.error("[assessment-service] Redis error:", err.message);
  });
  return client;
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
