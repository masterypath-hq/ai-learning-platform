import type { ChatMessage } from "../../domain/models/ChatMessage.js";
import type { ChatMessageRole } from "@ai-learning-platform/shared";

export interface IChatMessageRepository {
  create(params: { sessionId: string; role: ChatMessageRole; content: string }): Promise<ChatMessage>;
  /** Most recent messages first is NOT the contract — always returned oldest → newest. */
  findBySessionId(sessionId: string, limit?: number): Promise<ChatMessage[]>;
}
