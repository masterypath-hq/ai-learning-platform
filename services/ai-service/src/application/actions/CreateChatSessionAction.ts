import type { IChatSessionRepository } from "../interfaces/IChatSessionRepository.js";
import type { ICreateChatSessionAction } from "../interfaces/ICreateChatSessionAction.js";
import type { ICourseServiceClient } from "../interfaces/ICourseServiceClient.js";
import { formatLearnerProfile } from "../prompts/tutor.js";
import type { ChatSession, CreateChatSessionRequest } from "@ai-learning-platform/shared";

export class CreateChatSessionAction implements ICreateChatSessionAction {
  constructor(
    private readonly chatSessionRepo: IChatSessionRepository,
    private readonly courseServiceClient: ICourseServiceClient
  ) {}

  async execute(userId: string, request: CreateChatSessionRequest): Promise<ChatSession> {
    const learnerProfile = request.learnerProfile ?? (await this.deriveLearnerProfile(userId, request.track));

    const session = await this.chatSessionRepo.create({
      userId,
      subjectArea: request.subjectArea,
      track: request.track,
      topic: request.topic ?? null,
      learnerProfile,
    });
    return session.toResponse();
  }

  /** Best-effort: a lookup failure must never block chat session creation. */
  private async deriveLearnerProfile(userId: string, track: string): Promise<string | null> {
    try {
      const enrollments = await this.courseServiceClient.getEnrolledCourses(userId);
      const enrollment = enrollments.find((e) => e.slug === track);
      return enrollment ? formatLearnerProfile(enrollment) : null;
    } catch (err) {
      console.error("[ai-service] Failed to derive learner profile from enrollment:", err);
      return null;
    }
  }
}
