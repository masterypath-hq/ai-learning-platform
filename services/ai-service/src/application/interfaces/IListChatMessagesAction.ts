import type { ChatMessage } from "@ai-learning-platform/shared";

export interface IListChatMessagesAction {
  execute(userId: string, sessionId: string): Promise<ChatMessage[]>;
}
