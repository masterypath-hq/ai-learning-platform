import type Anthropic from "@anthropic-ai/sdk";
import {
  CourseOutlineResponseSchema,
  ModuleLessonsResponseSchema,
  type CourseOutlineResponse,
  type GeneratedModuleOutline,
  type ModuleLessonsResponse,
} from "@ai-learning-platform/shared";
import type { ICourseContentGenerator } from "../../application/interfaces/ICourseContentGenerator.js";
import { buildCourseOutlinePrompt, buildModuleLessonsPrompt } from "../../application/prompts/courseGen.js";
import { generateValidatedJson } from "./claudeJsonGeneration.js";

const OUTLINE_MAX_TOKENS = 8192;
// 3-5 lessons x 2-3 worked examples with full code solutions routinely exceeds 8192
// output tokens and gets cut off mid-JSON — the retry-with-errors pass hits the same
// cap and can't help. Non-streaming ceiling before HTTP timeouts become a concern.
const MODULE_LESSONS_MAX_TOKENS = 16000;

export class ClaudeCourseContentGenerator implements ICourseContentGenerator {
  constructor(private readonly client: Anthropic) {}

  async generateCourseOutline(trackSlug: string, title: string, description: string): Promise<CourseOutlineResponse> {
    const { system, user } = buildCourseOutlinePrompt(trackSlug, title, description);
    return generateValidatedJson(this.client, OUTLINE_MAX_TOKENS, system, user, CourseOutlineResponseSchema);
  }

  async generateModuleLessons(trackSlug: string, module: GeneratedModuleOutline): Promise<ModuleLessonsResponse> {
    const { system, user } = buildModuleLessonsPrompt(trackSlug, module);
    return generateValidatedJson(this.client, MODULE_LESSONS_MAX_TOKENS, system, user, ModuleLessonsResponseSchema);
  }
}
