import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  GenerateQuizRequest,
  GenerateQuizResponse,
  StartQuizAttemptRequest,
  SubmitQuizAttemptRequest,
  QuizAttemptResponse,
  RecordKnowledgeCheckCompletionRequest,
} from "@ai-learning-platform/shared";
import { apiFetch, ApiError } from "../api-client";

interface Envelope<T> {
  success: boolean;
  data: T;
  error: unknown;
}

/** Thrown on 409 — a module-quiz cool-down is active. */
export class CooldownActiveError extends Error {
  retryAvailableAt: string;
  constructor(retryAvailableAt: string) {
    super("A cool-down is active for this quiz.");
    this.name = "CooldownActiveError";
    this.retryAvailableAt = retryAvailableAt;
  }
}

function isCooldownBody(body: unknown): body is { error: { retryAvailableAt: string } } {
  return (
    !!body &&
    typeof body === "object" &&
    "error" in body &&
    !!(body as { error: unknown }).error &&
    typeof (body as { error: { retryAvailableAt?: unknown } }).error.retryAvailableAt === "string"
  );
}

export function useGenerateKnowledgeCheck() {
  return useMutation({
    mutationFn: (input: GenerateQuizRequest) =>
      apiFetch<Envelope<GenerateQuizResponse>>("/api/ai/quizzes/generate", { method: "POST", body: input }).then(
        (r) => r.data
      ),
  });
}

export function useRecordKnowledgeCheckCompletion() {
  return useMutation({
    mutationFn: (input: RecordKnowledgeCheckCompletionRequest) =>
      apiFetch<Envelope<null>>("/api/assessments/knowledge-checks/completed", { method: "POST", body: input }),
  });
}

export function useStartQuizAttempt() {
  return useMutation({
    mutationFn: async (input: StartQuizAttemptRequest) => {
      try {
        const res = await apiFetch<Envelope<QuizAttemptResponse>>("/api/assessments/attempts", {
          method: "POST",
          body: input,
        });
        return res.data;
      } catch (e) {
        if (e instanceof ApiError && e.status === 409 && isCooldownBody(e.body)) {
          throw new CooldownActiveError(e.body.error.retryAvailableAt);
        }
        throw e;
      }
    },
  });
}

export function useSubmitQuizAttempt() {
  return useMutation({
    mutationFn: (input: { attemptId: string; answers: SubmitQuizAttemptRequest["answers"] }) =>
      apiFetch<Envelope<QuizAttemptResponse>>(`/api/assessments/attempts/${input.attemptId}/submit`, {
        method: "POST",
        body: { answers: input.answers },
      }).then((r) => r.data),
  });
}

export function useQuizAttempts(courseId: string | undefined) {
  return useQuery({
    queryKey: ["quiz-attempts", courseId],
    queryFn: () =>
      apiFetch<Envelope<QuizAttemptResponse[]>>(`/api/assessments/attempts?courseId=${courseId}`).then((r) => r.data),
    enabled: !!courseId,
  });
}
