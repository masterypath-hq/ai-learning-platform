import Anthropic from "@anthropic-ai/sdk";
import type { ITutorStreamer, TutorStreamEvent, TutorStreamerMessage } from "../../application/interfaces/ITutorStreamer.js";

const MODEL = "claude-sonnet-4-5";
const MAX_TOKENS = 2048;

export class ClaudeTutorStreamer implements ITutorStreamer {
  constructor(private readonly client: Anthropic) {}

  async *stream(
    systemPrompt: string,
    messages: TutorStreamerMessage[],
    signal?: AbortSignal
  ): AsyncGenerator<TutorStreamEvent> {
    const stream = this.client.messages.stream(
      {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      },
      { signal }
    );

    try {
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          yield { type: "text_delta", text: event.delta.text };
        }
      }
    } catch (err) {
      if (signal?.aborted) return;
      const message = err instanceof Error ? err.message : "Claude streaming failed";
      yield { type: "error", message };
    }
  }
}
