import type { Streak } from "@ai-learning-platform/shared";

export interface IStreakRepository {
  find(userId: string): Promise<Streak | null>;
  upsert(streak: Streak): Promise<void>;
}
