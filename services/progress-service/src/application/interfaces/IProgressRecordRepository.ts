import type { ProgressActivityType, ProgressEvent, ProgressRecord } from "@ai-learning-platform/shared";

export interface IProgressRecordRepository {
  /** Idempotent for lesson_viewed (unique on user+lesson) — repeat views are no-ops. */
  record(event: ProgressEvent): Promise<void>;
  countDistinctLessonsViewed(userId: string, courseId: string): Promise<number>;
  findViewedLessonIds(userId: string, courseId: string): Promise<string[]>;
  /** Lessons whose knowledge check has been passed — the actual "lesson complete" signal used for
   *  course progress and sequential unlocking. findViewedLessonIds only reflects that a lesson's
   *  page was opened, not that the learner demonstrated understanding. */
  findKnowledgeCheckPassedLessonIds(userId: string, courseId: string): Promise<string[]>;
  findCompletedModuleIds(userId: string, courseId: string): Promise<string[]>;
  hasActivityType(userId: string, activityType: ProgressActivityType): Promise<boolean>;
  hasCourseActivityType(userId: string, courseId: string, activityType: ProgressActivityType): Promise<boolean>;
  /** Course of the user's most recent progress record, if any — drives "continue where you left off". */
  findMostRecentCourseId(userId: string): Promise<string | null>;
  /** Most recent activity across all types — powers the dashboard's activity feed. */
  findRecent(userId: string, limit: number): Promise<ProgressRecord[]>;
}
