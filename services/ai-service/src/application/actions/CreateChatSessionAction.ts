import type { IChatSessionRepository } from "../interfaces/IChatSessionRepository.js";
import type { ICreateChatSessionAction } from "../interfaces/ICreateChatSessionAction.js";
import type { ChatSession, CreateChatSessionRequest } from "@ai-learning-platform/shared";

export class CreateChatSessionAction implements ICreateChatSessionAction {
  constructor(private readonly chatSessionRepo: IChatSessionRepository) {}

  async execute(userId: string, request: CreateChatSessionRequest): Promise<ChatSession> {
    const session = await this.chatSessionRepo.create({
      userId,
      subjectArea: request.subjectArea,
      track: request.track,
      topic: request.topic ?? null,
    });
    return session.toResponse();
  }
}
