import type { CourseProgressDetail } from "@ai-learning-platform/shared";

export interface IGetCourseProgressAction {
  execute(userId: string, courseId: string): Promise<CourseProgressDetail>;
}
