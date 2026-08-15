import type { ChatSession } from "@ai-learning-platform/shared";

export interface ICloseChatSessionAction {
  execute(userId: string, sessionId: string): Promise<ChatSession>;
}
