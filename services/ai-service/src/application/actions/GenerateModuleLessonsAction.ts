import type { GeneratedModuleOutline, ModuleLessonsResponse } from "@ai-learning-platform/shared";
import type { ClaudeUsage, ICourseContentGenerator } from "../interfaces/ICourseContentGenerator.js";
import type { IGenerateModuleLessonsAction } from "../interfaces/IGenerateModuleLessonsAction.js";

/** Generates lessons for one module — the per-module Claude call that lets a caller persist and
 * checkpoint progress module by module instead of holding a whole course's content in memory. */
export class GenerateModuleLessonsAction implements IGenerateModuleLessonsAction {
  constructor(private readonly generator: ICourseContentGenerator) {}

  async execute(
    trackSlug: string,
    module: GeneratedModuleOutline
  ): Promise<{ data: ModuleLessonsResponse; usage: ClaudeUsage }> {
    return this.generator.generateModuleLessons(trackSlug, module);
  }
}
