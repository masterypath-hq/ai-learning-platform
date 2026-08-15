import { buildTutorSystemPrompt } from "../prompts/tutor.js";
import type { IChatSessionRepository } from "../interfaces/IChatSessionRepository.js";
import type { IChatMessageRepository } from "../interfaces/IChatMessageRepository.js";
import type { ITutorStreamer, TutorStreamerMessage } from "../interfaces/ITutorStreamer.js";
import type { IChatStreamPublisher } from "../interfaces/IChatStreamPublisher.js";
import type { ISendChatMessageAction } from "../interfaces/ISendChatMessageAction.js";
import type { ChatMessage } from "@ai-learning-platform/shared";

/** Keep the last ~20 turns (user + assistant pairs) in each Claude call. */
const MAX_HISTORY_MESSAGES = 40;

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
    this.streamReply(sessionId, session.subjectArea, session.track, session.topic)
      .catch((err) => {
        console.error("[ai-service] Unhandled error streaming tutor reply:", err);
      })
      .finally(() => {
        this.streamingSessionIds.delete(sessionId);
      });

    return userMessage.toResponse();
  }

  private async streamReply(
    sessionId: string,
    subjectArea: Parameters<typeof buildTutorSystemPrompt>[0],
    track: string,
    topic: string | null
  ): Promise<void> {
    const history = await this.chatMessageRepo.findBySessionId(sessionId);
    const truncated = history.slice(-MAX_HISTORY_MESSAGES);
    const messages: TutorStreamerMessage[] = truncated.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const systemPrompt = buildTutorSystemPrompt(subjectArea, track, topic);

    let fullText = "";
    try {
      for await (const event of this.streamer.stream(systemPrompt, messages)) {
        if (event.type === "text_delta") {
          fullText += event.text;
          await this.publisher.publish(sessionId, { type: "token", text: event.text });
        } else if (event.type === "error") {
          await this.publisher.publish(sessionId, { type: "error", message: event.message });
          return;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Tutor streaming failed";
      await this.publisher.publish(sessionId, { type: "error", message });
      return;
    }

    if (fullText.length > 0) {
      await this.chatMessageRepo.create({ sessionId, role: "assistant", content: fullText });
    }
    await this.publisher.publish(sessionId, { type: "done" });
  }
}
