import type { GeneratedModuleOutline, ModuleLessonsResponse } from "@ai-learning-platform/shared";
import type { ClaudeUsage } from "./ICourseContentGenerator.js";

export interface IGenerateModuleLessonsAction {
  execute(
    trackSlug: string,
    module: GeneratedModuleOutline
  ): Promise<{ data: ModuleLessonsResponse; usage: ClaudeUsage }>;
}
