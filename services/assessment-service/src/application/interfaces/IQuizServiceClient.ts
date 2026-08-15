import type { GenerateQuizRequest, GenerateQuizResponse, GradeShortAnswersRequest, GradeShortAnswersResponse } from "@ai-learning-platform/shared";

/** Talks to ai-service's internal-secret-protected quiz endpoints (never client-facing). */
export interface IQuizServiceClient {
  generate(request: GenerateQuizRequest): Promise<GenerateQuizResponse>;
  gradeShortAnswers(request: GradeShortAnswersRequest): Promise<GradeShortAnswersResponse>;
}
