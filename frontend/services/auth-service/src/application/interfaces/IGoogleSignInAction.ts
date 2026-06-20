import type { GoogleSignInResponse } from "@ai-learning-platform/shared";

export interface IGoogleSignInAction {
  execute(code: string): Promise<GoogleSignInResponse>;
}
