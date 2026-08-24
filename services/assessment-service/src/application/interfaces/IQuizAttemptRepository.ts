import type { GradedQuizType, QuestionFeedback, QuizAnswer } from "@ai-learning-platform/shared";
import type { QuizAttempt } from "../../domain/models/QuizAttempt.js";

export interface CreateQuizAttemptParams {
  userId: string;
  courseId: string;
  moduleId: string | null;
  type: GradedQuizType;
  scopeId: string;
  questions: QuizAttempt["questions"];
}

export interface SubmitQuizAttemptParams {
  answers: QuizAnswer[];
  score: number;
  passed: boolean;
  feedback: QuestionFeedback[];
}

export interface IQuizAttemptRepository {
  create(params: CreateQuizAttemptParams): Promise<QuizAttempt>;
  findById(id: string): Promise<QuizAttempt | null>;
  /** An attempt this user started for this (type, scope) that hasn't been submitted yet, if any. */
  findInProgress(userId: string, type: GradedQuizType, scopeId: string): Promise<QuizAttempt | null>;
  /** Most recent submitted, failed attempt for this (type, scope) — drives the retry cooldown. */
  findLatestFailed(userId: string, type: GradedQuizType, scopeId: string): Promise<QuizAttempt | null>;
  submit(id: string, params: SubmitQuizAttemptParams): Promise<QuizAttempt>;
  findByCourseId(userId: string, courseId: string): Promise<QuizAttempt[]>;
  /** Most recently submitted attempts across all of a user's courses — powers the progress dashboard. */
  findRecentByUserId(userId: string, limit: number): Promise<QuizAttempt[]>;
}
