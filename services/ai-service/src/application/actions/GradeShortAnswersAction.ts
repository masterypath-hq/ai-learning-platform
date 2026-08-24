import type { GradeShortAnswersRequest, GradeShortAnswersResponse } from "@ai-learning-platform/shared";
import type { IGradeShortAnswersAction } from "../interfaces/IGradeShortAnswersAction.js";
import type { IQuizGenerator } from "../interfaces/IQuizGenerator.js";

export class GradeShortAnswersAction implements IGradeShortAnswersAction {
  constructor(private readonly quizGenerator: IQuizGenerator) {}

  async execute(request: GradeShortAnswersRequest): Promise<GradeShortAnswersResponse> {
    const results = await this.quizGenerator.gradeShortAnswers(request.items);
    return { results };
  }
}
