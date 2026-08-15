import type { PublicQuizQuestion, QuizAttemptResponse } from "@ai-learning-platform/shared";
import type { QuizAttempt } from "../../domain/models/QuizAttempt.js";
import { cooldownEndsAt } from "../quizCooldown.js";

export function toQuizAttemptResponse(attempt: QuizAttempt): QuizAttemptResponse {
  const questions: PublicQuizQuestion[] = attempt.questions.map((q) => ({
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    options: q.options,
  }));

  const retryAvailableAt =
    attempt.passed === false && attempt.submittedAt ? cooldownEndsAt(attempt.type, attempt.submittedAt) : null;

  return {
    id: attempt.id,
    userId: attempt.userId,
    courseId: attempt.courseId,
    moduleId: attempt.moduleId,
    type: attempt.type,
    questions,
    answers: attempt.answers,
    score: attempt.score,
    passed: attempt.passed,
    feedback: attempt.feedback,
    retryAvailableAt: retryAvailableAt ? retryAvailableAt.toISOString() : null,
    startedAt: attempt.startedAt.toISOString(),
    submittedAt: attempt.submittedAt ? attempt.submittedAt.toISOString() : null,
  };
}
