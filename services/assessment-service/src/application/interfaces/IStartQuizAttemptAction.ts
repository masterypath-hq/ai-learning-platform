import type { StartQuizAttemptRequest } from "@ai-learning-platform/shared";
import type { QuizAttempt } from "../../domain/models/QuizAttempt.js";

export interface IStartQuizAttemptAction {
  execute(userId: string, request: StartQuizAttemptRequest): Promise<QuizAttempt>;
}
