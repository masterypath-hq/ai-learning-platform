import type { CourseOutlineResponse } from "@ai-learning-platform/shared";
import type { ClaudeUsage } from "./ICourseContentGenerator.js";

export interface IGenerateCourseOutlineAction {
  execute(trackSlug: string, title: string, description: string): Promise<{ data: CourseOutlineResponse; usage: ClaudeUsage }>;
}
