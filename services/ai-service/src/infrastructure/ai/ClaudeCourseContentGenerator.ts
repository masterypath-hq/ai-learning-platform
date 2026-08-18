import type Anthropic from "@anthropic-ai/sdk";
import {
  CourseOutlineResponseSchema,
  ModuleLessonsResponseSchema,
  type CourseOutlineResponse,
  type GeneratedModuleOutline,
  type ModuleLessonsResponse,
} from "@ai-learning-platform/shared";
import type { ClaudeUsage, ICourseContentGenerator } from "../../application/interfaces/ICourseContentGenerator.js";
import { buildCourseOutlinePrompt, buildModuleLessonsPrompt } from "../../application/prompts/courseGen.js";
import { generateValidatedJson } from "./claudeJsonGeneration.js";

const OUTLINE_MAX_TOKENS = 8192;
// 3-5 lessons x 2-3 worked examples with full code solutions routinely exceeds 8192
// output tokens and gets cut off mid-JSON — the retry-with-errors pass hits the same
// cap and can't help. 24000 and 48000 both still truncated on content-heavy modules,
// so this is set to claude-sonnet-4-5's actual output ceiling; the call streams (see
// claudeJsonGeneration.ts) so there's no HTTP-timeout reason to stay lower.
const MODULE_LESSONS_MAX_TOKENS = 64000;

export class ClaudeCourseContentGenerator implements ICourseContentGenerator {
  constructor(private readonly client: Anthropic) {}

  async generateCourseOutline(
    trackSlug: string,
    title: string,
    description: string
  ): Promise<{ data: CourseOutlineResponse; usage: ClaudeUsage }> {
    const { system, user } = buildCourseOutlinePrompt(trackSlug, title, description);
    return generateValidatedJson(this.client, OUTLINE_MAX_TOKENS, system, user, CourseOutlineResponseSchema);
  }

  async generateModuleLessons(
    trackSlug: string,
    module: GeneratedModuleOutline
  ): Promise<{ data: ModuleLessonsResponse; usage: ClaudeUsage }> {
    const { system, user } = buildModuleLessonsPrompt(trackSlug, module);
    return generateValidatedJson(this.client, MODULE_LESSONS_MAX_TOKENS, system, user, ModuleLessonsResponseSchema);
  }
}
