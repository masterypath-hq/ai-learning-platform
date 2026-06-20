import type { GenerateCourseRequest, GenerateCourseResponse } from "@ai-learning-platform/shared";

/** Port: generate course action. (SOLID: I — fine-grained action interface.) */
export interface IGenerateCourseAction {
  execute(userId: string, request: GenerateCourseRequest): Promise<GenerateCourseResponse>;
}
