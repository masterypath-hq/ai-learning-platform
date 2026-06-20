import type { ForgotPasswordResponse } from "@ai-learning-platform/shared";

export interface IForgotPasswordAction {
  execute(email: string, resetLinkBaseUrl: string): Promise<ForgotPasswordResponse>;
}
