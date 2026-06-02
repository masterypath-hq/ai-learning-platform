import type { Subject, CourseTrack, CourseLevel } from "@ai-learning-platform/shared";

export interface CourseOutlineModule {
  theme: string;
  keyConcepts: string[];
  estimatedDurationMinutes: number;
}

export interface CourseOutline {
  title: string;
  description: string;
  learningObjectives: string[];
  prerequisites: string[];
  estimatedDurationMinutes: number;
  modules: CourseOutlineModule[];
}

export interface GenerateCourseOutlineParams {
  subject: Subject;
  track: CourseTrack;
  level: CourseLevel;
  userBackground?: string;
}

export interface ModuleLessonWorkedExample {
  title: string;
  content: string;
  solution: string;
}

export interface ModuleLessonPracticeExercise {
  title: string;
  prompt: string;
  hints: string[];
  sampleSolution: string;
}

export interface ModuleLessonItem {
  title: string;
  explanationContent: string;
  keyTakeaways: string[];
  estimatedDurationMinutes: number;
  workedExamples: ModuleLessonWorkedExample[];
  practiceExercise: ModuleLessonPracticeExercise;
}

export interface ModuleLessonsResult {
  lessons: ModuleLessonItem[];
}

export interface GenerateModuleLessonsParams {
  subject: Subject;
  track: CourseTrack;
  level: CourseLevel;
  moduleTheme: string;
  keyConcepts: string[];
}

/** Port: AI content generation. (SOLID: D — depend on abstraction.) */
export interface IAIContentGenerator {
  generateCourseOutline(params: GenerateCourseOutlineParams): Promise<CourseOutline>;
  generateModuleLessons(params: GenerateModuleLessonsParams): Promise<ModuleLessonsResult>;
}
