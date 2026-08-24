import type { Streak } from "@ai-learning-platform/shared";

/** Extracts the UTC calendar date (YYYY-MM-DD) from an ISO 8601 timestamp. */
export function toUtcDateString(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function daysBetweenUtcDates(from: string, to: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / msPerDay);
}

/**
 * CLAUDE.md: "Streaks reset at midnight UTC if no learning activity." Any qualifying
 * activity counts once per UTC day: same-day activity is a no-op, activity on the very
 * next UTC day extends the streak, and any larger gap (or a user's first-ever activity)
 * resets it to 1. `longestStreak` only ever grows.
 */
export function nextStreak(current: Streak, activityUtcDate: string): Streak {
  if (current.lastActivityDate === activityUtcDate) {
    return current;
  }

  const gapDays = current.lastActivityDate === null ? null : daysBetweenUtcDates(current.lastActivityDate, activityUtcDate);
  const currentStreak = gapDays === 1 ? current.currentStreak + 1 : 1;

  return {
    userId: current.userId,
    currentStreak,
    longestStreak: Math.max(current.longestStreak, currentStreak),
    lastActivityDate: activityUtcDate,
  };
}
