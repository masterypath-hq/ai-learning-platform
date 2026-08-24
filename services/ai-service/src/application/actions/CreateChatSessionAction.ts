import type { IChatSessionRepository } from "../interfaces/IChatSessionRepository.js";
import type { ICreateChatSessionAction } from "../interfaces/ICreateChatSessionAction.js";
import type { ICourseServiceClient } from "../interfaces/ICourseServiceClient.js";
import { formatLearnerProfile } from "../prompts/tutor.js";
import type { CurriculumEntry, LessonSnapshot } from "../../domain/models/ChatSession.js";
import type { ChatSession, CreateChatSessionRequest } from "@ai-learning-platform/shared";

export class CreateChatSessionAction implements ICreateChatSessionAction {
  constructor(
    private readonly chatSessionRepo: IChatSessionRepository,
    private readonly courseServiceClient: ICourseServiceClient
  ) {}

  async execute(userId: string, request: CreateChatSessionRequest): Promise<ChatSession> {
    // Re-clicking a lesson resumes its still-open chat instead of spawning a duplicate session.
    const existing = await this.chatSessionRepo.findOpenByUserAndLesson(userId, request.lessonId);
    if (existing) return existing.toResponse();

    const { courseId, moduleId, lesson } = await this.courseServiceClient.getLesson(request.lessonId);
    const course = await this.courseServiceClient.getCourse(courseId);
    const currentModule = course.modules.find((m) => m.id === moduleId);
    if (!currentModule) throw new Error("MODULE_NOT_FOUND");

    const learnerProfile = await this.deriveLearnerProfile(userId, courseId);

    const lessonSnapshot: LessonSnapshot = {
      title: lesson.title,
      explanationContent: lesson.explanationContent,
      keyTakeaways: lesson.keyTakeaways,
      workedExampleTitles: lesson.workedExamples.map((we) => we.title),
    };

    const curriculumSnapshot: CurriculumEntry[] = course.modules
      .filter((m) => m.orderIndex > currentModule.orderIndex)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((m) => ({ phase: m.phase, title: m.title }));

    const session = await this.chatSessionRepo.create({
      userId,
      // Every course in the catalog today is a programming/AI-engineering track — there are no
      // finance courses to derive "finance" from yet. Revisit if/when one is added.
      subjectArea: "programming",
      track: course.slug,
      topic: lesson.title,
      learnerProfile,
      lessonId: request.lessonId,
      moduleId,
      courseId,
      lessonSnapshot,
      curriculumSnapshot,
    });
    return session.toResponse();
  }

  /** Best-effort: a lookup failure must never block chat session creation. */
  private async deriveLearnerProfile(userId: string, courseId: string): Promise<string | null> {
    try {
      const enrollments = await this.courseServiceClient.getEnrolledCourses(userId);
      const enrollment = enrollments.find((e) => e.courseId === courseId);
      return enrollment ? formatLearnerProfile(enrollment) : null;
    } catch (err) {
      console.error("[ai-service] Failed to derive learner profile from enrollment:", err);
      return null;
    }
  }
}
