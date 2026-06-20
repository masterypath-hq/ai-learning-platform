import type { SignInResponse } from "@ai-learning-platform/shared";

export interface ISignInAction {
  execute(email: string, password: string): Promise<SignInResponse>;
}
