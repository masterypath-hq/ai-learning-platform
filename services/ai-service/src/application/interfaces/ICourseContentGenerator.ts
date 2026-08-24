import type { CourseOutlineResponse, GeneratedModuleOutline, ModuleLessonsResponse } from "@ai-learning-platform/shared";

export type ClaudeUsage = { inputTokens: number; outputTokens: number };

export interface ICourseContentGenerator {
  generateCourseOutline(
    trackSlug: string,
    title: string,
    description: string
  ): Promise<{ data: CourseOutlineResponse; usage: ClaudeUsage }>;
  generateModuleLessons(
    trackSlug: string,
    module: GeneratedModuleOutline
  ): Promise<{ data: ModuleLessonsResponse; usage: ClaudeUsage }>;
}
