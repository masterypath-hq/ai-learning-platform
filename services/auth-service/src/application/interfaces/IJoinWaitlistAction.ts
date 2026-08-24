import type { JoinWaitlistResponse } from "@ai-learning-platform/shared";

export interface IJoinWaitlistAction {
  execute(email: string, source?: string): Promise<JoinWaitlistResponse>;
}
