import type { BadgeId, CourseProgressSummary, DashboardResponse, RecentQuizScore } from "@ai-learning-platform/shared";
import type { IProgressRecordRepository } from "../interfaces/IProgressRecordRepository.js";
import type { IStreakRepository } from "../interfaces/IStreakRepository.js";
import type { ICourseServiceClient } from "../interfaces/ICourseServiceClient.js";
import type { IAssessmentServiceClient } from "../interfaces/IAssessmentServiceClient.js";
import type { IGetDashboardAction } from "../interfaces/IGetDashboardAction.js";

const RECENT_QUIZ_SCORES_LIMIT = 5;
const RECENT_ACTIVITY_LIMIT = 8;
const SEVEN_DAY_STREAK_THRESHOLD = 7;

export class GetDashboardAction implements IGetDashboardAction {
  constructor(
    private readonly progressRecordRepo: IProgressRecordRepository,
    private readonly streakRepo: IStreakRepository,
    private readonly courseServiceClient: ICourseServiceClient,
    private readonly assessmentServiceClient: IAssessmentServiceClient
  ) {}

  async execute(userId: string): Promise<DashboardResponse> {
    const enrolledCourses = await this.courseServiceClient.getEnrolledCourses(userId);

    const courses: CourseProgressSummary[] = [];
    let anyCourseComplete = false;
    for (const enrolled of enrolledCourses) {
      const course = await this.courseServiceClient.getCourse(enrolled.courseId);
      const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
      const viewedCount = await this.progressRecordRepo.countDistinctLessonsViewed(userId, enrolled.courseId);
      const completionPercent = totalLessons > 0 ? Math.round((viewedCount / totalLessons) * 100) : 0;
      if (completionPercent >= 100) anyCourseComplete = true;
      courses.push({ courseId: enrolled.courseId, title: enrolled.title, completionPercent });
    }

    const streak = (await this.streakRepo.find(userId)) ?? {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
    };

    const recentAttempts = await this.assessmentServiceClient.getRecentAttempts(userId, RECENT_QUIZ_SCORES_LIMIT);
    const recentQuizScores: RecentQuizScore[] = recentAttempts.map((a) => ({
      attemptId: a.id,
      courseId: a.courseId,
      score: a.score,
      passed: a.passed,
      submittedAt: a.submittedAt,
    }));

    const [hasLessonView, hasQuizPass] = await Promise.all([
      this.progressRecordRepo.hasActivityType(userId, "lesson_viewed"),
      this.progressRecordRepo.hasActivityType(userId, "module_completed"),
    ]);

    const badges: BadgeId[] = [];
    if (hasLessonView) badges.push("first_lesson");
    if (streak.currentStreak >= SEVEN_DAY_STREAK_THRESHOLD) badges.push("seven_day_streak");
    if (anyCourseComplete) badges.push("first_course_completed");
    if (hasQuizPass) badges.push("first_quiz_passed");

    const recommendedNextAction = await this.buildRecommendedNextAction(userId);
    const recentActivity = await this.progressRecordRepo.findRecent(userId, RECENT_ACTIVITY_LIMIT);

    return { courses, streak, recentQuizScores, badges, recommendedNextAction, recentActivity };
  }

  private async buildRecommendedNextAction(userId: string): Promise<DashboardResponse["recommendedNextAction"]> {
    const courseId = await this.progressRecordRepo.findMostRecentCourseId(userId);
    if (!courseId) return null;

    const course = await this.courseServiceClient.getCourse(courseId);
    const viewedLessonIds = new Set(await this.progressRecordRepo.findViewedLessonIds(userId, courseId));

    const modules = [...course.modules].sort((a, b) => a.orderIndex - b.orderIndex);
    for (const mod of modules) {
      const lessons = [...mod.lessons].sort((a, b) => a.orderIndex - b.orderIndex);
      for (const lesson of lessons) {
        if (!viewedLessonIds.has(lesson.id)) {
          return { courseId, lessonId: lesson.id, label: `Continue: ${lesson.title}` };
        }
      }
    }
    return null;
  }
}
