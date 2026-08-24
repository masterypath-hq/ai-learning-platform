import type { GeneratedQuizQuestion, GradeShortAnswerItem, GradeShortAnswerResult } from "@ai-learning-platform/shared";

export interface IQuizGenerator {
  generateKnowledgeCheck(lesson: { title: string; explanationContent: string | null; keyTakeaways: string[] }): Promise<GeneratedQuizQuestion[]>;

  generateModuleQuiz(
    module: { title: string; description: string | null; keyConcepts: string[] },
    lessons: { title: string; explanationContent: string | null; keyTakeaways: string[] }[]
  ): Promise<GeneratedQuizQuestion[]>;

  generateCourseFinal(course: {
    title: string;
    learningObjectives: string[];
    modules: { title: string; description: string | null; keyConcepts: string[] }[];
  }): Promise<GeneratedQuizQuestion[]>;

  gradeShortAnswers(items: GradeShortAnswerItem[]): Promise<GradeShortAnswerResult[]>;
}
