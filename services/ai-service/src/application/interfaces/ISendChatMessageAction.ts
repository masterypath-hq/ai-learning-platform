import type { ChatMessage } from "@ai-learning-platform/shared";

export interface ISendChatMessageAction {
  /**
   * Persists the user's message and returns it immediately. The assistant's
   * reply is streamed asynchronously over the `IChatStreamPublisher` and
   * persisted on completion — callers do not await it here.
   */
  execute(userId: string, sessionId: string, content: string): Promise<ChatMessage>;
}
