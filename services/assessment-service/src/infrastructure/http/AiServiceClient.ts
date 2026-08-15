import type { GenerateQuizRequest, GenerateQuizResponse, GradeShortAnswersRequest, GradeShortAnswersResponse } from "@ai-learning-platform/shared";
import type { IQuizServiceClient } from "../../application/interfaces/IQuizServiceClient.js";

export class AiServiceClient implements IQuizServiceClient {
  constructor(
    private readonly baseUrl: string,
    private readonly internalServiceSecret: string
  ) {}

  async generate(request: GenerateQuizRequest): Promise<GenerateQuizResponse> {
    const body = await this.post("/internal/quizzes/generate", request);
    return body.data as GenerateQuizResponse;
  }

  async gradeShortAnswers(request: GradeShortAnswersRequest): Promise<GradeShortAnswersResponse> {
    const body = await this.post("/internal/quizzes/grade", request);
    return body.data as GradeShortAnswersResponse;
  }

  private async post(path: string, payload: unknown): Promise<{ success: boolean; data: unknown; error: unknown }> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-secret": this.internalServiceSecret },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      throw new Error(`ai-service ${path} failed: ${res.status} ${JSON.stringify(body.error)}`);
    }
    return body;
  }
}
