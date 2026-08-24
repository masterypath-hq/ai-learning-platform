import type { ProgressEvent } from "@ai-learning-platform/shared";
import type { IProgressRecordRepository } from "../interfaces/IProgressRecordRepository.js";
import type { IStreakRepository } from "../interfaces/IStreakRepository.js";
import type { IRecordProgressEventAction } from "../interfaces/IRecordProgressEventAction.js";
import { nextStreak, toUtcDateString } from "../streakMath.js";

export class RecordProgressEventAction implements IRecordProgressEventAction {
  constructor(
    private readonly progressRecordRepo: IProgressRecordRepository,
    private readonly streakRepo: IStreakRepository
  ) {}

  async execute(event: ProgressEvent): Promise<void> {
    await this.progressRecordRepo.record(event);

    const existing = await this.streakRepo.find(event.userId);
    const current = existing ?? { userId: event.userId, currentStreak: 0, longestStreak: 0, lastActivityDate: null };
    const updated = nextStreak(current, toUtcDateString(event.occurredAt));

    if (updated !== current) {
      await this.streakRepo.upsert(updated);
    }
  }
}
