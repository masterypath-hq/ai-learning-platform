import type { CourseOutlineResponse } from "@ai-learning-platform/shared";
import type { ClaudeUsage, ICourseContentGenerator } from "../interfaces/ICourseContentGenerator.js";
import type { IGenerateCourseOutlineAction } from "../interfaces/IGenerateCourseOutlineAction.js";

/** Generates just the module outline for a course — the single Claude call that starts an
 * incremental, resumable generation run. Callers persist the result before generating lessons. */
export class GenerateCourseOutlineAction implements IGenerateCourseOutlineAction {
  constructor(private readonly generator: ICourseContentGenerator) {}

  async execute(
    trackSlug: string,
    title: string,
    description: string
  ): Promise<{ data: CourseOutlineResponse; usage: ClaudeUsage }> {
    return this.generator.generateCourseOutline(trackSlug, title, description);
  }
}
