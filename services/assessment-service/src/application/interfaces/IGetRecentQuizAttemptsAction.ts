import type { QuizAttempt } from "../../domain/models/QuizAttempt.js";

export interface IGetRecentQuizAttemptsAction {
  execute(userId: string, limit: number): Promise<QuizAttempt[]>;
}
