import type { ResetPasswordResponse } from "@ai-learning-platform/shared";

export interface IResetPasswordAction {
  execute(token: string, newPassword: string): Promise<ResetPasswordResponse>;
}
