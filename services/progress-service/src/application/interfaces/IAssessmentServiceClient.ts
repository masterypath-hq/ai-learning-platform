import type { RecentQuizAttempt } from "@ai-learning-platform/shared";

export interface IAssessmentServiceClient {
  getRecentAttempts(userId: string, limit: number): Promise<RecentQuizAttempt[]>;
}
