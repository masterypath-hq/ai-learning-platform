import type { Lesson } from "../../domain/models/Lesson.js";
import type { WorkedExample } from "../../domain/models/WorkedExample.js";
import type { PracticeExercise } from "../../domain/models/PracticeExercise.js";

export interface LessonBundle {
  lessons: Lesson[];
  workedExamples: WorkedExample[];
  practiceExercises: PracticeExercise[];
}

/** Port: lesson persistence (includes worked examples + practice exercises). (SOLID: D, I.) */
export interface ILessonRepository {
  /** Saves lessons, their worked examples, and practice exercises in a single transaction. */
  saveAll(
    lessons: Lesson[],
    workedExamples: WorkedExample[],
    practiceExercises: PracticeExercise[]
  ): Promise<void>;
  findByModuleId(moduleId: string): Promise<LessonBundle>;
}
