/**
 * Progress dashboard / streak contracts (Stage 6). Zod-validated.
 */
import { z } from "zod";

export const ProgressActivityTypeSchema = z.enum([
  "lesson_viewed",
  "knowledge_check_completed",
  "module_completed",
  "course_completed",
  "chat_session_closed",
]);
export type ProgressActivityType = z.infer<typeof ProgressActivityTypeSchema>;

export const ProgressRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  courseId: z.string().nullable(), // null for activity not tied to a course, e.g. chat_session_closed
  lessonId: z.string().nullable(),
  moduleId: z.string().nullable(),
  activityType: ProgressActivityTypeSchema,
  occurredAt: z.string(), // ISO 8601
});
export type ProgressRecord = z.infer<typeof ProgressRecordSchema>;

/** Redis pub/sub payload — same shape minus `id`, which progress-service assigns on persist. */
export const ProgressEventSchema = ProgressRecordSchema.omit({ id: true });
export type ProgressEvent = z.infer<typeof ProgressEventSchema>;

/** Pub/sub channel a given activity type is published on, e.g. `progress:module_completed`. */
export function progressEventChannel(activityType: ProgressActivityType): string {
  return `progress:${activityType}`;
}

export const StreakSchema = z.object({
  userId: z.string(),
  currentStreak: z.number().int().min(0),
  longestStreak: z.number().int().min(0),
  lastActivityDate: z.string().nullable(), // UTC date, YYYY-MM-DD
});
export type Streak = z.infer<typeof StreakSchema>;

export const BadgeIdSchema = z.enum([
  "first_lesson",
  "seven_day_streak",
  "first_course_completed",
  "first_quiz_passed",
]);
export type BadgeId = z.infer<typeof BadgeIdSchema>;

export const CourseProgressSummarySchema = z.object({
  courseId: z.string(),
  title: z.string(),
  completionPercent: z.number().min(0).max(100),
});
export type CourseProgressSummary = z.infer<typeof CourseProgressSummarySchema>;

export const RecentQuizScoreSchema = z.object({
  attemptId: z.string(),
  courseId: z.string(),
  score: z.number().min(0).max(100),
  passed: z.boolean(),
  submittedAt: z.string(),
});
export type RecentQuizScore = z.infer<typeof RecentQuizScoreSchema>;

/** "Continue where you left off" — the default recommendation. */
export const ContinueRecommendationSchema = z.object({
  type: z.literal("continue"),
  courseId: z.string(),
  lessonId: z.string(),
  label: z.string(),
});
export type ContinueRecommendation = z.infer<typeof ContinueRecommendationSchema>;

/**
 * Offered after finishing one native mobile track (mobile-android/mobile-ios) with no
 * enrollment yet in the other — "master the other platform" accelerated path. Carries a
 * track slug rather than a courseId since the user may not have a course row for it yet;
 * the frontend resolves the real course via its own tracks data before enrolling.
 */
export const AcceleratorRecommendationSchema = z.object({
  type: z.literal("accelerator"),
  targetTrackSlug: z.string(),
  label: z.string(),
});
export type AcceleratorRecommendation = z.infer<typeof AcceleratorRecommendationSchema>;

export const RecommendedNextActionSchema = z
  .discriminatedUnion("type", [ContinueRecommendationSchema, AcceleratorRecommendationSchema])
  .nullable();
export type RecommendedNextAction = z.infer<typeof RecommendedNextActionSchema>;

export const DashboardResponseSchema = z.object({
  courses: z.array(CourseProgressSummarySchema),
  streak: StreakSchema,
  recentQuizScores: z.array(RecentQuizScoreSchema).max(5),
  badges: z.array(BadgeIdSchema),
  recommendedNextAction: RecommendedNextActionSchema,
  recentActivity: z.array(ProgressRecordSchema),
});
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;

export const LessonProgressItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  durationMins: z.number().nullable(),
});
export type LessonProgressItem = z.infer<typeof LessonProgressItemSchema>;

export const CourseProgressDetailSchema = z.object({
  courseId: z.string(),
  completedLessons: z.array(LessonProgressItemSchema),
  remainingLessons: z.array(LessonProgressItemSchema),
  completionPercent: z.number().min(0).max(100),
  estimatedMinutesRemaining: z.number().min(0),
});
export type CourseProgressDetail = z.infer<typeof CourseProgressDetailSchema>;

/** Mirrors course-contracts.ts's PhaseLevel — kept local per this file's self-contained convention. */
export const ModulePhaseSchema = z.enum(["foundation", "intermediate", "advanced", "mastery"]);
export type ModulePhase = z.infer<typeof ModulePhaseSchema>;

export const LessonStatusItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  orderIndex: z.number().int(),
  /** True once this lesson's knowledge check has been passed — not merely opened. */
  completed: z.boolean(),
  /** True until the previous lesson in this module is completed (or the module itself is locked). */
  locked: z.boolean(),
});
export type LessonStatusItem = z.infer<typeof LessonStatusItemSchema>;

/**
 * Sequential module/lesson unlock state for one course enrollment — the source of truth the
 * dashboard and course page render locked/greyed cards from. A module is `completed` only once
 * all its lessons are viewed AND its quiz is passed; the next module/lesson stays `locked` until
 * then. The first module overall is never locked.
 */
export const ModuleStatusResponseSchema = z.object({
  moduleId: z.string(),
  phase: ModulePhaseSchema,
  title: z.string(),
  orderIndex: z.number().int(),
  lessons: z.array(LessonStatusItemSchema),
  quizPassed: z.boolean(),
  completed: z.boolean(),
  locked: z.boolean(),
});
export type ModuleStatusResponse = z.infer<typeof ModuleStatusResponseSchema>;
