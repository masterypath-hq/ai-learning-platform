import type { Redis } from "ioredis";
import type { IGoogleCallbackStore } from "../../application/interfaces/IGoogleCallbackStore.js";
import type { GoogleSignInResponse } from "@ai-learning-platform/shared";

const CALLBACK_TTL_SECONDS = 300;

const CONSUME_SCRIPT = `
local val = redis.call('GET', KEYS[1])
if val then redis.call('DEL', KEYS[1]) end
return val
`;

export class RedisGoogleCallbackStore implements IGoogleCallbackStore {
  constructor(private readonly redis: Redis) {}

  async save(code: string, data: GoogleSignInResponse): Promise<void> {
    await this.redis.set(`oauth:callback:${code}`, JSON.stringify(data), "EX", CALLBACK_TTL_SECONDS);
  }

  async consume(code: string): Promise<GoogleSignInResponse | null> {
    const raw = (await this.redis.eval(CONSUME_SCRIPT, 1, `oauth:callback:${code}`)) as string | null;
    if (!raw) return null;
    return JSON.parse(raw) as GoogleSignInResponse;
  }
}
