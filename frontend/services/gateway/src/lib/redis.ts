import { Redis } from "ioredis";

let client: Redis | null = null;

export type RedisClient = Redis;

export function getRedisClient(url: string): Redis {
  if (client) return client;

  client = new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  client.on("error", (err: Error) => {
    console.error("[gateway] Redis connection error:", err.message);
  });

  client.on("connect", () => {
    console.log("[gateway] Redis connected");
  });

  return client;
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
