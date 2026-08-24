import type { RecentQuizAttempt } from "@ai-learning-platform/shared";
import type { IAssessmentServiceClient } from "../../application/interfaces/IAssessmentServiceClient.js";

export class AssessmentServiceClient implements IAssessmentServiceClient {
  constructor(
    private readonly baseUrl: string,
    private readonly internalServiceSecret: string
  ) {}

  async getRecentAttempts(userId: string, limit: number): Promise<RecentQuizAttempt[]> {
    const url = `${this.baseUrl}/internal/attempts/recent?userId=${encodeURIComponent(userId)}&limit=${limit}`;
    const res = await fetch(url, { headers: { "x-internal-secret": this.internalServiceSecret } });
    if (!res.ok) throw new Error(`assessment-service getRecentAttempts failed: ${res.status} ${await res.text()}`);
    const body = (await res.json()) as { data: RecentQuizAttempt[] };
    return body.data;
  }
}
