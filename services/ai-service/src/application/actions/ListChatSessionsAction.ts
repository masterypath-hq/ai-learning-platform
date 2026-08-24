import type { ChatSession } from "@ai-learning-platform/shared";
import type { IChatSessionRepository } from "../interfaces/IChatSessionRepository.js";
import type { IListChatSessionsAction } from "../interfaces/IListChatSessionsAction.js";

export class ListChatSessionsAction implements IListChatSessionsAction {
  constructor(private readonly chatSessionRepo: IChatSessionRepository) {}

  async execute(userId: string): Promise<ChatSession[]> {
    const sessions = await this.chatSessionRepo.findByUserId(userId);
    return sessions.map((s) => s.toResponse());
  }
}
