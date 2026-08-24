import type { ChatSession } from "@ai-learning-platform/shared";

export interface IListChatSessionsAction {
  execute(userId: string): Promise<ChatSession[]>;
}
