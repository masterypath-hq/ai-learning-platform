import type { ChatMessage } from "@ai-learning-platform/shared";
import type { IChatSessionRepository } from "../interfaces/IChatSessionRepository.js";
import type { IChatMessageRepository } from "../interfaces/IChatMessageRepository.js";
import type { IListChatMessagesAction } from "../interfaces/IListChatMessagesAction.js";

export class ListChatMessagesAction implements IListChatMessagesAction {
  constructor(
    private readonly chatSessionRepo: IChatSessionRepository,
    private readonly chatMessageRepo: IChatMessageRepository
  ) {}

  async execute(userId: string, sessionId: string): Promise<ChatMessage[]> {
    const session = await this.chatSessionRepo.findById(sessionId);
    if (!session) throw new Error("SESSION_NOT_FOUND");
    if (session.userId !== userId) throw new Error("SESSION_FORBIDDEN");

    const messages = await this.chatMessageRepo.findBySessionId(sessionId);
    return messages.map((m) => m.toResponse());
  }
}
