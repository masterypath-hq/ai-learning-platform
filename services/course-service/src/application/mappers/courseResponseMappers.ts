import type { Lesson } from "../../domain/models/Lesson.js";
import type { Module } from "../../domain/models/Module.js";
import type { WorkedExample } from "../../domain/models/WorkedExample.js";
import type { PracticeExercise } from "../../domain/models/PracticeExercise.js";
import type { LessonResponse, ModuleResponse, PracticeExerciseResponse, WorkedExampleResponse } from "@ai-learning-platform/shared";

export function mapLessonToResponse(
  lesson: Lesson,
  workedExamples: WorkedExample[],
  practiceExercise: PracticeExercise | null
): LessonResponse {
  const examples: WorkedExampleResponse[] = workedExamples.map((we) => ({
    id: we.id,
    position: we.position,
    title: we.title,
    content: we.content,
    solution: we.solution,
  }));

  const practiceExerciseResponse: PracticeExerciseResponse | null = practiceExercise
    ? {
        id: practiceExercise.id,
        title: practiceExercise.title,
        prompt: practiceExercise.prompt,
        hints: practiceExercise.hints,
        sampleSolution: practiceExercise.sampleSolution,
      }
    : null;

  return {
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    contentUrl: lesson.contentUrl,
    contentType: lesson.contentType,
    explanationContent: lesson.explanationContent,
    keyTakeaways: lesson.keyTakeaways,
    durationMins: lesson.durationMins,
    orderIndex: lesson.orderIndex,
    isPublished: lesson.isPublished,
    isProject: lesson.isProject,
    workedExamples: examples,
    practiceExercise: practiceExerciseResponse,
  };
}

export function mapModuleToResponse(mod: Module, lessons: LessonResponse[]): ModuleResponse {
  return {
    id: mod.id,
    phase: mod.phase,
    title: mod.title,
    description: mod.description,
    keyConcepts: mod.keyConcepts,
    orderIndex: mod.orderIndex,
    durationWeeks: mod.durationWeeks,
    isPublished: mod.isPublished,
    lessons,
  };
}
