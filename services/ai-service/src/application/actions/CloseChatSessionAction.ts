import { buildSessionSummaryPrompt, SessionSummarySchema, type SessionSummary } from "../prompts/sessionSummary.js";
import type { IChatSessionRepository } from "../interfaces/IChatSessionRepository.js";
import type { IChatMessageRepository } from "../interfaces/IChatMessageRepository.js";
import type { IChatSummaryGenerator } from "../interfaces/IChatSummaryGenerator.js";
import type { ICloseChatSessionAction } from "../interfaces/ICloseChatSessionAction.js";
import type { IProgressEventPublisher } from "../interfaces/IProgressEventPublisher.js";
import type { ChatSession } from "@ai-learning-platform/shared";

type ParseResult = { ok: true; summary: SessionSummary } | { ok: false; error: string };

function extractJson(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  return start === -1 || end === -1 ? raw : raw.slice(start, end + 1);
}

function tryParseSummary(raw: string): ParseResult {
  let candidate: unknown;
  try {
    candidate = JSON.parse(extractJson(raw));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid JSON";
    return { ok: false, error: `Response was not valid JSON: ${message}` };
  }
  const parsed = SessionSummarySchema.safeParse(candidate);
  return parsed.success ? { ok: true, summary: parsed.data } : { ok: false, error: parsed.error.message };
}

export class CloseChatSessionAction implements ICloseChatSessionAction {
  constructor(
    private readonly chatSessionRepo: IChatSessionRepository,
    private readonly chatMessageRepo: IChatMessageRepository,
    private readonly summaryGenerator: IChatSummaryGenerator,
    private readonly progressEventPublisher: IProgressEventPublisher
  ) {}

  async execute(userId: string, sessionId: string): Promise<ChatSession> {
    const session = await this.chatSessionRepo.findById(sessionId);
    if (!session) throw new Error("SESSION_NOT_FOUND");
    if (session.userId !== userId) throw new Error("SESSION_FORBIDDEN");
    if (session.closedAt) return session.toResponse();

    const messages = await this.chatMessageRepo.findBySessionId(sessionId);
    const summaryMessages = messages.map((m) => ({ role: m.role, content: m.content }));

    let summary = "This session ended before any messages were exchanged.";
    let suggestedNextQuestions: string[] = [];

    if (messages.length > 0) {
      const parsed = await this.generateSummary(summaryMessages);
      summary = parsed.summary;
      suggestedNextQuestions = parsed.suggestedNextQuestions;
    }

    const closed = await this.chatSessionRepo.close(sessionId, summary, suggestedNextQuestions);

    await this.progressEventPublisher.publish({
      userId,
      courseId: null,
      moduleId: null,
      lessonId: null,
      activityType: "chat_session_closed",
      occurredAt: new Date().toISOString(),
    });

    return closed.toResponse();
  }

  private async generateSummary(
    messages: { role: "user" | "assistant"; content: string }[]
  ): Promise<SessionSummary> {
    const firstAttempt = await this.summaryGenerator.generate(buildSessionSummaryPrompt(messages));
    const firstResult = tryParseSummary(firstAttempt);
    if (firstResult.ok) return firstResult.summary;

    const retryPrompt = buildSessionSummaryPrompt(messages, firstResult.error);
    const secondAttempt = await this.summaryGenerator.generate(retryPrompt);
    const secondResult = tryParseSummary(secondAttempt);
    if (secondResult.ok) return secondResult.summary;

    throw new Error(`Failed to generate a valid session summary: ${secondResult.error}`);
  }
}
