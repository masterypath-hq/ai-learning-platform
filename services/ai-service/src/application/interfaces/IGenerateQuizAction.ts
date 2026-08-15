import type { GenerateQuizRequest, GenerateQuizResponse } from "@ai-learning-platform/shared";

export interface IGenerateQuizAction {
  execute(request: GenerateQuizRequest): Promise<GenerateQuizResponse>;
}
