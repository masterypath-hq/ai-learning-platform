import type { StartQuizAttemptRequest } from "@ai-learning-platform/shared";
import type { QuizAttempt } from "../../domain/models/QuizAttempt.js";
import type { IQuizAttemptRepository } from "../interfaces/IQuizAttemptRepository.js";
import type { IQuizServiceClient } from "../interfaces/IQuizServiceClient.js";
import type { IStartQuizAttemptAction } from "../interfaces/IStartQuizAttemptAction.js";
import { CooldownActiveError } from "../errors/CooldownActiveError.js";
import { cooldownEndsAt } from "../quizCooldown.js";

export class StartQuizAttemptAction implements IStartQuizAttemptAction {
  constructor(
    private readonly attemptRepo: IQuizAttemptRepository,
    private readonly quizServiceClient: IQuizServiceClient
  ) {}

  async execute(userId: string, request: StartQuizAttemptRequest): Promise<QuizAttempt> {
    const scopeId = request.type === "module_quiz" ? (request.moduleId as string) : request.courseId;

    const latestFailed = await this.attemptRepo.findLatestFailed(userId, request.type, scopeId);
    if (latestFailed?.submittedAt) {
      const retryAvailableAt = cooldownEndsAt(request.type, latestFailed.submittedAt);
      if (retryAvailableAt.getTime() > Date.now()) {
        throw new CooldownActiveError(retryAvailableAt);
      }
    }

    const inProgress = await this.attemptRepo.findInProgress(userId, request.type, scopeId);
    if (inProgress) return inProgress;

    const generated = await this.quizServiceClient.generate({
      type: request.type,
      moduleId: request.type === "module_quiz" ? request.moduleId : undefined,
      courseId: request.type === "course_final" ? request.courseId : undefined,
      userLevel: request.userLevel,
    });

    return this.attemptRepo.create({
      userId,
      courseId: request.courseId,
      moduleId: request.type === "module_quiz" ? (request.moduleId ?? null) : null,
      type: request.type,
      scopeId,
      questions: generated.questions,
    });
  }
}
