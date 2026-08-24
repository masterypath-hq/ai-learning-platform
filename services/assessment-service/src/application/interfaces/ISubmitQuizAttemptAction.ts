import type { QuizAnswer } from "@ai-learning-platform/shared";
import type { QuizAttempt } from "../../domain/models/QuizAttempt.js";

export interface ISubmitQuizAttemptAction {
  execute(userId: string, attemptId: string, answers: QuizAnswer[]): Promise<QuizAttempt>;
}
