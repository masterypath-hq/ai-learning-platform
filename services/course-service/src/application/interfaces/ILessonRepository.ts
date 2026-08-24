import type { Lesson } from "../../domain/models/Lesson.js";
import type { WorkedExample } from "../../domain/models/WorkedExample.js";
import type { PracticeExercise } from "../../domain/models/PracticeExercise.js";

export interface LessonBundle {
  lessons: Lesson[];
  workedExamples: WorkedExample[];
  practiceExercises: PracticeExercise[];
}

export interface LessonWithContent {
  lesson: Lesson;
  workedExamples: WorkedExample[];
  practiceExercise: PracticeExercise | null;
}

export interface ILessonRepository {
  findByModuleId(moduleId: string): Promise<LessonBundle>;
  findById(id: string): Promise<LessonWithContent | null>;
}
