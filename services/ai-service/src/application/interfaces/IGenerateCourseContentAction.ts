import type { GenerateCourseContentRequest, PersistCourseContentRequest } from "@ai-learning-platform/shared";

export interface IGenerateCourseContentAction {
  execute(request: GenerateCourseContentRequest): Promise<PersistCourseContentRequest>;
}
