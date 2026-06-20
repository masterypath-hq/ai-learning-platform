import type { CourseResponse } from "@ai-learning-platform/shared";

/** Port: get full course detail action. (SOLID: I — fine-grained action interface.) */
export interface IGetCourseAction {
  execute(courseId: string, userId: string): Promise<CourseResponse>;
}
