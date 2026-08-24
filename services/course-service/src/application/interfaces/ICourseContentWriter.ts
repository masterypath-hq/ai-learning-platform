import type { PersistCourseContentRequest } from "@ai-learning-platform/shared";

export interface ICourseContentWriter {
  replaceContent(courseId: string, content: PersistCourseContentRequest): Promise<void>;
}
