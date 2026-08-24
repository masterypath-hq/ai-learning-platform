import type { QuizAttempt } from "../../domain/models/QuizAttempt.js";
import type { IQuizAttemptRepository } from "../interfaces/IQuizAttemptRepository.js";
import type { IGetRecentQuizAttemptsAction } from "../interfaces/IGetRecentQuizAttemptsAction.js";

export class GetRecentQuizAttemptsAction implements IGetRecentQuizAttemptsAction {
  constructor(private readonly attemptRepo: IQuizAttemptRepository) {}

  async execute(userId: string, limit: number): Promise<QuizAttempt[]> {
    return this.attemptRepo.findRecentByUserId(userId, limit);
  }
}
