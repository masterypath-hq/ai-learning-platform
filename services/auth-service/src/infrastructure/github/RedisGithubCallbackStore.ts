import type { Redis } from "ioredis";
import type { IGithubCallbackStore } from "../../application/interfaces/IGithubCallbackStore.js";
import type { GithubSignInResponse } from "@ai-learning-platform/shared";

const CALLBACK_TTL_SECONDS = 300;

const CONSUME_SCRIPT = `
local val = redis.call('GET', KEYS[1])
if val then redis.call('DEL', KEYS[1]) end
return val
`;

export class RedisGithubCallbackStore implements IGithubCallbackStore {
  constructor(private readonly redis: Redis) {}

  async save(code: string, data: GithubSignInResponse): Promise<void> {
    await this.redis.set(`oauth:github:callback:${code}`, JSON.stringify(data), "EX", CALLBACK_TTL_SECONDS);
  }

  async consume(code: string): Promise<GithubSignInResponse | null> {
    const raw = (await this.redis.eval(CONSUME_SCRIPT, 1, `oauth:github:callback:${code}`)) as string | null;
    if (!raw) return null;
    return JSON.parse(raw) as GithubSignInResponse;
  }
}
