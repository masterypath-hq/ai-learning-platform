import type { ChatSession, CurriculumEntry, LessonSnapshot } from "../../domain/models/ChatSession.js";
import type { ChatSubjectArea } from "@ai-learning-platform/shared";

export interface IChatSessionRepository {
  create(params: {
    userId: string;
    subjectArea: ChatSubjectArea;
    track: string;
    topic: string | null;
    learnerProfile: string | null;
    lessonId: string;
    moduleId: string;
    courseId: string;
    lessonSnapshot: LessonSnapshot;
    curriculumSnapshot: CurriculumEntry[];
  }): Promise<ChatSession>;
  findById(id: string): Promise<ChatSession | null>;
  findByUserId(userId: string): Promise<ChatSession[]>;
  /** The open (not-yet-closed) session for this user+lesson, if one exists — powers resume. */
  findOpenByUserAndLesson(userId: string, lessonId: string): Promise<ChatSession | null>;
  close(id: string, summary: string, suggestedNextQuestions: string[]): Promise<ChatSession>;
}
