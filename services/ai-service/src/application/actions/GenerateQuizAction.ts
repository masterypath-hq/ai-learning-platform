import { v4 as uuidv4 } from "uuid";
import type { GenerateQuizRequest, GenerateQuizResponse, GeneratedQuizQuestion, QuizQuestion } from "@ai-learning-platform/shared";
import type { ICourseServiceClient } from "../interfaces/ICourseServiceClient.js";
import type { IGenerateQuizAction } from "../interfaces/IGenerateQuizAction.js";
import type { IQuizGenerator } from "../interfaces/IQuizGenerator.js";

function withIds(questions: GeneratedQuizQuestion[]): QuizQuestion[] {
  return questions.map((q) => ({ ...q, id: uuidv4() }));
}

export class GenerateQuizAction implements IGenerateQuizAction {
  constructor(
    private readonly quizGenerator: IQuizGenerator,
    private readonly courseServiceClient: ICourseServiceClient
  ) {}

  async execute(request: GenerateQuizRequest): Promise<GenerateQuizResponse> {
    if (request.type === "knowledge_check") {
      const { lesson } = await this.courseServiceClient.getLesson(request.lessonId as string);
      const questions = await this.quizGenerator.generateKnowledgeCheck(lesson);
      return { questions: withIds(questions) };
    }

    if (request.type === "module_quiz") {
      const { module } = await this.courseServiceClient.getModule(request.moduleId as string);
      const questions = await this.quizGenerator.generateModuleQuiz(module, module.lessons);
      return { questions: withIds(questions) };
    }

    const course = await this.courseServiceClient.getCourse(request.courseId as string);
    const questions = await this.quizGenerator.generateCourseFinal({
      title: course.title,
      learningObjectives: course.learningObjectives,
      modules: course.modules,
    });
    return { questions: withIds(questions) };
  }
}
