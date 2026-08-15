import type Anthropic from "@anthropic-ai/sdk";
import {
  GradeShortAnswersResponseSchema,
  GradedQuizGenerationSchema,
  KnowledgeCheckGenerationSchema,
  type GeneratedQuizQuestion,
  type GradeShortAnswerItem,
  type GradeShortAnswerResult,
} from "@ai-learning-platform/shared";
import type { IQuizGenerator } from "../../application/interfaces/IQuizGenerator.js";
import {
  buildCourseFinalPrompt,
  buildGradeShortAnswersPrompt,
  buildKnowledgeCheckPrompt,
  buildModuleQuizPrompt,
} from "../../application/prompts/quizGen.js";
import { generateValidatedJson } from "./claudeJsonGeneration.js";

// 10-15 questions (module/course-final quizzes) can exceed 8192 output tokens and
// get cut off mid-JSON, the same failure mode hit by course-content generation.
const MAX_TOKENS = 16000;

export class ClaudeQuizGenerator implements IQuizGenerator {
  constructor(private readonly client: Anthropic) {}

  async generateKnowledgeCheck(lesson: {
    title: string;
    explanationContent: string | null;
    keyTakeaways: string[];
  }): Promise<GeneratedQuizQuestion[]> {
    const { system, user } = buildKnowledgeCheckPrompt(lesson);
    const result = await generateValidatedJson(this.client, MAX_TOKENS, system, user, KnowledgeCheckGenerationSchema);
    return result.questions;
  }

  async generateModuleQuiz(
    module: { title: string; description: string | null; keyConcepts: string[] },
    lessons: { title: string; explanationContent: string | null; keyTakeaways: string[] }[]
  ): Promise<GeneratedQuizQuestion[]> {
    const { system, user } = buildModuleQuizPrompt(module, lessons);
    const result = await generateValidatedJson(this.client, MAX_TOKENS, system, user, GradedQuizGenerationSchema);
    return result.questions;
  }

  async generateCourseFinal(course: {
    title: string;
    learningObjectives: string[];
    modules: { title: string; description: string | null; keyConcepts: string[] }[];
  }): Promise<GeneratedQuizQuestion[]> {
    const { system, user } = buildCourseFinalPrompt(course);
    const result = await generateValidatedJson(this.client, MAX_TOKENS, system, user, GradedQuizGenerationSchema);
    return result.questions;
  }

  async gradeShortAnswers(items: GradeShortAnswerItem[]): Promise<GradeShortAnswerResult[]> {
    const { system, user } = buildGradeShortAnswersPrompt(items);
    const result = await generateValidatedJson(this.client, MAX_TOKENS, system, user, GradeShortAnswersResponseSchema);
    return result.results;
  }
}
