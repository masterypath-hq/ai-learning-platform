import type { ChatSession } from "../../domain/models/ChatSession.js";
import type { ChatSubjectArea } from "@ai-learning-platform/shared";

export interface IChatSessionRepository {
  create(params: {
    userId: string;
    subjectArea: ChatSubjectArea;
    track: string;
    topic: string | null;
  }): Promise<ChatSession>;
  findById(id: string): Promise<ChatSession | null>;
  findByUserId(userId: string): Promise<ChatSession[]>;
  close(id: string, summary: string, suggestedNextQuestions: string[]): Promise<ChatSession>;
}
