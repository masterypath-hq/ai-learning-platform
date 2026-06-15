import type { Lesson } from "../../domain/models/Lesson.js";
import type { WorkedExample } from "../../domain/models/WorkedExample.js";
import type { PracticeExercise } from "../../domain/models/PracticeExercise.js";

export interface LessonBundle {
  lessons: Lesson[];
  workedExamples: WorkedExample[];
  practiceExercises: PracticeExercise[];
}

export interface ILessonRepository {
  findByModuleId(moduleId: string): Promise<LessonBundle>;
}
