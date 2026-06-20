import type { SignUpResponse } from "@ai-learning-platform/shared";

export interface ISignUpAction {
  execute(email: string, password: string, name?: string): Promise<SignUpResponse>;
}
