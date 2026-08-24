import type { QuizAttempt } from "../../domain/models/QuizAttempt.js";
import type { IListQuizAttemptsAction } from "../interfaces/IListQuizAttemptsAction.js";
import type { IQuizAttemptRepository } from "../interfaces/IQuizAttemptRepository.js";

export class ListQuizAttemptsAction implements IListQuizAttemptsAction {
  constructor(private readonly attemptRepo: IQuizAttemptRepository) {}

  async execute(userId: string, courseId: string): Promise<QuizAttempt[]> {
    return this.attemptRepo.findByCourseId(userId, courseId);
  }
}
