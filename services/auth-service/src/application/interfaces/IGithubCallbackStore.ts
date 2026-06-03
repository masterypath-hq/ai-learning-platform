import type { GithubSignInResponse } from "@ai-learning-platform/shared";

export interface IGithubCallbackStore {
  save(code: string, data: GithubSignInResponse): Promise<void>;
  consume(code: string): Promise<GithubSignInResponse | null>;
}
