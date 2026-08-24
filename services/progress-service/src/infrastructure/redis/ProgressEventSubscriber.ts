import type { Redis } from "ioredis";
import { ProgressEventSchema, progressEventChannel, type ProgressActivityType } from "@ai-learning-platform/shared";
import type { IRecordProgressEventAction } from "../../application/interfaces/IRecordProgressEventAction.js";

const ACTIVITY_TYPES: ProgressActivityType[] = [
  "lesson_viewed",
  "knowledge_check_completed",
  "module_completed",
  "chat_session_closed",
];

/**
 * `redis` must be a connection dedicated to subscribing (e.g. `mainClient.duplicate()`) —
 * once a connection issues SUBSCRIBE it can't run other commands.
 */
export class ProgressEventSubscriber {
  constructor(
    private readonly redis: Redis,
    private readonly recordProgressEventAction: IRecordProgressEventAction
  ) {}

  async start(): Promise<void> {
    const channels = ACTIVITY_TYPES.map(progressEventChannel);
    await this.redis.subscribe(...channels);

    this.redis.on("message", (_channel: string, message: string) => {
      void this.handleMessage(message);
    });

    console.log(`[progress-service] Subscribed to progress events: ${channels.join(", ")}`);
  }

  private async handleMessage(message: string): Promise<void> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(message);
    } catch (err) {
      console.error("[progress-service] Failed to parse progress event message:", err);
      return;
    }

    const result = ProgressEventSchema.safeParse(parsed);
    if (!result.success) {
      console.error("[progress-service] Invalid progress event:", result.error.message);
      return;
    }

    try {
      await this.recordProgressEventAction.execute(result.data);
    } catch (err) {
      console.error("[progress-service] Failed to record progress event:", err);
    }
  }
}
