import { buildTutorSystemPrompt } from "../prompts/tutor.js";
import type { CurriculumEntry, LessonSnapshot } from "../../domain/models/ChatSession.js";
import type { IChatSessionRepository } from "../interfaces/IChatSessionRepository.js";
import type { IChatMessageRepository } from "../interfaces/IChatMessageRepository.js";
import type { ITutorStreamer, TutorStreamerMessage } from "../interfaces/ITutorStreamer.js";
import type { ChatStreamEvent, IChatStreamPublisher } from "../interfaces/IChatStreamPublisher.js";
import type { ISendChatMessageAction } from "../interfaces/ISendChatMessageAction.js";
import type { ChatMessage } from "@ai-learning-platform/shared";

/** Keep the last ~20 turns (user + assistant pairs) in each Claude call. */
const MAX_HISTORY_MESSAGES = 40;

/** Synthetic first turn for a brand-new session — never persisted to chat_messages, just gives
 *  Claude something to open against so the tutor starts teaching instead of waiting to be asked. */
const KICKOFF_MESSAGE = "Let's begin — start teaching me this lesson.";

export class SendChatMessageAction implements ISendChatMessageAction {
  /** Sessions with an in-flight streamReply — guards against two concurrent sends
   *  racing to rebuild history and publish tokens on the same Redis channel. */
  private readonly streamingSessionIds = new Set<string>();

  constructor(
    private readonly chatSessionRepo: IChatSessionRepository,
    private readonly chatMessageRepo: IChatMessageRepository,
    private readonly streamer: ITutorStreamer,
    private readonly publisher: IChatStreamPublisher
  ) {}

  async execute(userId: string, sessionId: string, content: string): Promise<ChatMessage> {
    const session = await this.chatSessionRepo.findById(sessionId);
    if (!session) throw new Error("SESSION_NOT_FOUND");
    if (session.userId !== userId) throw new Error("SESSION_FORBIDDEN");
    if (session.closedAt) throw new Error("SESSION_CLOSED");
    if (this.streamingSessionIds.has(sessionId)) throw new Error("SESSION_BUSY");

    const userMessage = await this.chatMessageRepo.create({ sessionId, role: "user", content });

    this.streamingSessionIds.add(sessionId);
    this.streamReply(
      sessionId,
      session.subjectArea,
      session.track,
      session.topic,
      session.learnerProfile,
      session.lessonSnapshot,
      session.curriculumSnapshot
    )
      .catch((err) => {
        console.error("[ai-service] Unhandled error streaming tutor reply:", err);
      })
      .finally(() => {
        this.streamingSessionIds.delete(sessionId);
      });

    return userMessage.toResponse();
  }

  /** Triggers the tutor's opening message for a session that has no messages yet. Idempotent by
   *  construction: once the opening reply is persisted, findBySessionId is no longer empty, so a
   *  repeat call is rejected instead of generating a second opener. */
  async startConversation(userId: string, sessionId: string): Promise<void> {
    const session = await this.chatSessionRepo.findById(sessionId);
    if (!session) throw new Error("SESSION_NOT_FOUND");
    if (session.userId !== userId) throw new Error("SESSION_FORBIDDEN");
    if (session.closedAt) throw new Error("SESSION_CLOSED");
    if (this.streamingSessionIds.has(sessionId)) throw new Error("SESSION_BUSY");

    const existing = await this.chatMessageRepo.findBySessionId(sessionId);
    if (existing.length > 0) throw new Error("CONVERSATION_ALREADY_STARTED");

    this.streamingSessionIds.add(sessionId);
    this.streamReply(
      sessionId,
      session.subjectArea,
      session.track,
      session.topic,
      session.learnerProfile,
      session.lessonSnapshot,
      session.curriculumSnapshot
    )
      .catch((err) => {
        console.error("[ai-service] Unhandled error streaming tutor opener:", err);
      })
      .finally(() => {
        this.streamingSessionIds.delete(sessionId);
      });
  }

  private async streamReply(
    sessionId: string,
    subjectArea: Parameters<typeof buildTutorSystemPrompt>[0],
    track: string,
    topic: string | null,
    learnerProfile: string | null,
    lessonSnapshot: LessonSnapshot | null,
    curriculumSnapshot: CurriculumEntry[]
  ): Promise<void> {
    const history = await this.chatMessageRepo.findBySessionId(sessionId);
    const truncated = history.slice(-MAX_HISTORY_MESSAGES);
    const messages: TutorStreamerMessage[] =
      truncated.length > 0
        ? truncated.map((m) => ({ role: m.role, content: m.content }))
        : [{ role: "user", content: KICKOFF_MESSAGE }];

    const systemPrompt = buildTutorSystemPrompt(
      subjectArea,
      track,
      topic,
      learnerProfile,
      lessonSnapshot,
      curriculumSnapshot
    );

    let fullText = "";
    try {
      for await (const event of this.streamer.stream(systemPrompt, messages)) {
        if (event.type === "text_delta") {
          fullText += event.text;
          await this.safePublish(sessionId, { type: "token", text: event.text });
        } else if (event.type === "error") {
          console.error(`[ai-service] Tutor stream error for session ${sessionId}:`, event.message);
          await this.safePublish(sessionId, { type: "error", message: event.message });
          return;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Tutor streaming failed";
      console.error(`[ai-service] Tutor stream threw for session ${sessionId}:`, err);
      await this.safePublish(sessionId, { type: "error", message });
      return;
    }

    if (fullText.length > 0) {
      await this.chatMessageRepo.create({ sessionId, role: "assistant", content: fullText });
    }
    await this.safePublish(sessionId, { type: "done" });
  }

  /** A publish failure (e.g. a transient Redis blip) must never lose an already-generated reply
   *  or mask the real streaming error by throwing back into the try/catch above it. */
  private async safePublish(sessionId: string, event: ChatStreamEvent): Promise<void> {
    try {
      await this.publisher.publish(sessionId, event);
    } catch (err) {
      console.error("[ai-service] Failed to publish chat stream event:", err);
    }
  }
}
