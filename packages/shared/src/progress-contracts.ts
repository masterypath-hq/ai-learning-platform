/**
 * Progress dashboard / streak contracts (Stage 6). Zod-validated.
 */
import { z } from "zod";

export const ProgressActivityTypeSchema = z.enum([
  "lesson_viewed",
  "knowledge_check_completed",
  "module_completed",
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

export const DashboardResponseSchema = z.object({
  courses: z.array(CourseProgressSummarySchema),
  streak: StreakSchema,
  recentQuizScores: z.array(RecentQuizScoreSchema).max(5),
  badges: z.array(BadgeIdSchema),
  recommendedNextAction: z
    .object({
      courseId: z.string(),
      lessonId: z.string(),
      label: z.string(),
    })
    .nullable(),
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
