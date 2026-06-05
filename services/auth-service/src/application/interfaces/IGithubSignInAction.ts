import type { GithubSignInResponse } from "@ai-learning-platform/shared";

export interface IGithubSignInAction {
  execute(code: string): Promise<GithubSignInResponse>;
}
