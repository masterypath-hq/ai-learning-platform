import type { CourseResponse } from "@ai-learning-platform/shared";

export interface IGetCourseAction {
  execute(courseId: string): Promise<CourseResponse>;
}
