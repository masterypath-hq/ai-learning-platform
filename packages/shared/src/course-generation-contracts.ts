/**
 * AI course-content generation contracts (Stage 4). Zod-validated.
 *
 * Flow: ai-service generates content for one catalog course (POST /internal/courses/generate),
 * course-service persists it as-is (POST /api/v1/courses/:id/content). Both validate against
 * these schemas so a malformed Claude response never reaches the database.
 */
import { z } from "zod";

export const PhaseLevelSchema = z.enum(["foundation", "intermediate", "advanced", "mastery"]);

export const GenerateCourseContentRequestSchema = z.object({
  trackSlug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
});
export type GenerateCourseContentRequest = z.infer<typeof GenerateCourseContentRequestSchema>;

export const GeneratedWorkedExampleSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  solution: z.string().min(1),
});
export type GeneratedWorkedExample = z.infer<typeof GeneratedWorkedExampleSchema>;

export const GeneratedPracticeExerciseSchema = z.object({
  title: z.string().min(1),
  prompt: z.string().min(1),
  hints: z.array(z.string().min(1)).min(2).max(3),
  sampleSolution: z.string().min(1),
});
export type GeneratedPracticeExercise = z.infer<typeof GeneratedPracticeExerciseSchema>;

export const GeneratedLessonSchema = z.object({
  title: z.string().min(1),
  explanationContent: z.string().min(200),
  keyTakeaways: z.array(z.string().min(1)).min(3).max(5),
  durationMins: z.number().int().positive(),
  workedExamples: z.array(GeneratedWorkedExampleSchema).min(2).max(3),
  practiceExercise: GeneratedPracticeExerciseSchema,
});
export type GeneratedLesson = z.infer<typeof GeneratedLessonSchema>;

export const ModuleLessonsResponseSchema = z.object({
  lessons: z.array(GeneratedLessonSchema).min(3).max(5),
});
export type ModuleLessonsResponse = z.infer<typeof ModuleLessonsResponseSchema>;

export const GeneratedModuleOutlineSchema = z.object({
  phase: PhaseLevelSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  keyConcepts: z.array(z.string().min(1)).min(3).max(6),
  durationWeeks: z.number().int().positive(),
});
export type GeneratedModuleOutline = z.infer<typeof GeneratedModuleOutlineSchema>;

export const CourseOutlineResponseSchema = z.object({
  learningObjectives: z.array(z.string().min(1)).min(3).max(5),
  prerequisites: z.array(z.string().min(1)),
  modules: z
    .array(GeneratedModuleOutlineSchema)
    .min(6)
    .max(10)
    .refine(
      (modules) => {
        const phases = new Set(modules.map((m) => m.phase));
        return (["foundation", "intermediate", "advanced", "mastery"] as const).every((p) => phases.has(p));
      },
      { message: "Every phase (foundation, intermediate, advanced, mastery) needs at least one module" }
    ),
});
export type CourseOutlineResponse = z.infer<typeof CourseOutlineResponseSchema>;

// ----- Persisted to course-service -----

export const PersistLessonSchema = GeneratedLessonSchema.extend({
  orderIndex: z.number().int().nonnegative(),
});
export type PersistLesson = z.infer<typeof PersistLessonSchema>;

export const PersistModuleSchema = z.object({
  phase: PhaseLevelSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  keyConcepts: z.array(z.string().min(1)),
  durationWeeks: z.number().int().positive(),
  orderIndex: z.number().int().nonnegative(),
  lessons: z.array(PersistLessonSchema).min(1),
});
export type PersistModule = z.infer<typeof PersistModuleSchema>;

export const PersistCourseContentRequestSchema = z.object({
  learningObjectives: z.array(z.string().min(1)),
  prerequisites: z.array(z.string().min(1)),
  modules: z.array(PersistModuleSchema).min(1),
});
export type PersistCourseContentRequest = z.infer<typeof PersistCourseContentRequestSchema>;

// ----- Incremental generation (checkpointed persistence + resume) -----

/** Request body for POST /internal/courses/modules/lessons on ai-service. */
export const GenerateModuleLessonsRequestSchema = z.object({
  trackSlug: z.string().min(1),
  module: GeneratedModuleOutlineSchema,
});
export type GenerateModuleLessonsRequest = z.infer<typeof GenerateModuleLessonsRequestSchema>;

/** Claude token usage for one generation call, surfaced for cost logging. */
export const ClaudeUsageSchema = z.object({
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
});
export type ClaudeUsage = z.infer<typeof ClaudeUsageSchema>;

/** Request body for POST /api/v1/courses/:id/generation/outline on course-service. Server assigns
 * orderIndex from array position, so callers must submit modules already in phase order. */
export const PersistOutlineRequestSchema = CourseOutlineResponseSchema;
export type PersistOutlineRequest = z.infer<typeof PersistOutlineRequestSchema>;

/** Request body for POST /api/v1/courses/:id/generation/modules/:moduleId/lessons. */
export const PersistModuleLessonsRequestSchema = ModuleLessonsResponseSchema;
export type PersistModuleLessonsRequest = z.infer<typeof PersistModuleLessonsRequestSchema>;

export const GenerationModuleStatusSchema = z.object({
  id: z.string().uuid(),
  phase: PhaseLevelSchema,
  title: z.string(),
  description: z.string(),
  keyConcepts: z.array(z.string()),
  durationWeeks: z.number().int().positive(),
  orderIndex: z.number().int().nonnegative(),
  lessonsGenerated: z.boolean(),
});
export type GenerationModuleStatus = z.infer<typeof GenerationModuleStatusSchema>;

/** Response body for GET /api/v1/courses/:id/generation/status — the resume/report source of truth. */
export const GenerationStatusResponseSchema = z.object({
  courseId: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  hasOutline: z.boolean(),
  isFullyGenerated: z.boolean(),
  modules: z.array(GenerationModuleStatusSchema),
});
export type GenerationStatusResponse = z.infer<typeof GenerationStatusResponseSchema>;
