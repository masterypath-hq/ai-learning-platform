import type { ChatSession, CreateChatSessionRequest } from "@ai-learning-platform/shared";

export interface ICreateChatSessionAction {
  execute(userId: string, request: CreateChatSessionRequest): Promise<ChatSession>;
}
