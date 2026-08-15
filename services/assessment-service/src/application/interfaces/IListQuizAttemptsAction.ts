import type { QuizAttempt } from "../../domain/models/QuizAttempt.js";

export interface IListQuizAttemptsAction {
  execute(userId: string, courseId: string): Promise<QuizAttempt[]>;
}
