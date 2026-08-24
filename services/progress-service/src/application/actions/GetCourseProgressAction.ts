import type { CourseProgressDetail, LessonProgressItem } from "@ai-learning-platform/shared";
import type { IProgressRecordRepository } from "../interfaces/IProgressRecordRepository.js";
import type { ICourseServiceClient } from "../interfaces/ICourseServiceClient.js";
import type { IGetCourseProgressAction } from "../interfaces/IGetCourseProgressAction.js";

export class GetCourseProgressAction implements IGetCourseProgressAction {
  constructor(
    private readonly progressRecordRepo: IProgressRecordRepository,
    private readonly courseServiceClient: ICourseServiceClient
  ) {}

  async execute(userId: string, courseId: string): Promise<CourseProgressDetail> {
    const course = await this.courseServiceClient.getCourse(courseId);
    // "Complete" means the lesson's knowledge check was passed, not merely that the page was
    // opened — lesson_viewed fires automatically on mount and isn't a real completion signal.
    const passedLessonIds = new Set(await this.progressRecordRepo.findKnowledgeCheckPassedLessonIds(userId, courseId));

    const completedLessons: LessonProgressItem[] = [];
    const remainingLessons: LessonProgressItem[] = [];
    let estimatedMinutesRemaining = 0;

    const modules = [...course.modules].sort((a, b) => a.orderIndex - b.orderIndex);
    for (const mod of modules) {
      const lessons = [...mod.lessons].sort((a, b) => a.orderIndex - b.orderIndex);
      for (const lesson of lessons) {
        const item: LessonProgressItem = { id: lesson.id, title: lesson.title, durationMins: lesson.durationMins };
        if (passedLessonIds.has(lesson.id)) {
          completedLessons.push(item);
        } else {
          remainingLessons.push(item);
          estimatedMinutesRemaining += lesson.durationMins ?? 0;
        }
      }
    }

    const total = completedLessons.length + remainingLessons.length;
    const completionPercent = total > 0 ? Math.round((completedLessons.length / total) * 100) : 0;

    return { courseId, completedLessons, remainingLessons, completionPercent, estimatedMinutesRemaining };
  }
}
