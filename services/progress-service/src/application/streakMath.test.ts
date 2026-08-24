import { nextStreak, toUtcDateString } from "./streakMath.js";
import type { Streak } from "@ai-learning-platform/shared";

function makeStreak(overrides: Partial<Streak> = {}): Streak {
  return { userId: "user-1", currentStreak: 0, longestStreak: 0, lastActivityDate: null, ...overrides };
}

describe("toUtcDateString", () => {
  it("extracts the UTC calendar date regardless of the time-of-day component", () => {
    expect(toUtcDateString("2026-08-14T23:59:59.000Z")).toBe("2026-08-14");
    expect(toUtcDateString("2026-08-14T00:00:00.001Z")).toBe("2026-08-14");
  });
});

describe("nextStreak", () => {
  it("starts a new streak at 1 on a user's first-ever activity", () => {
    const result = nextStreak(makeStreak(), "2026-08-14");
    expect(result).toEqual({ userId: "user-1", currentStreak: 1, longestStreak: 1, lastActivityDate: "2026-08-14" });
  });

  it("is a no-op for a second activity on the same UTC day", () => {
    const current = makeStreak({ currentStreak: 3, longestStreak: 5, lastActivityDate: "2026-08-14" });
    const result = nextStreak(current, "2026-08-14");
    expect(result).toBe(current);
  });

  it("extends the streak when activity lands on the very next UTC day", () => {
    const current = makeStreak({ currentStreak: 3, longestStreak: 5, lastActivityDate: "2026-08-14" });
    const result = nextStreak(current, "2026-08-15");
    expect(result).toEqual({ userId: "user-1", currentStreak: 4, longestStreak: 5, lastActivityDate: "2026-08-15" });
  });

  it("extends the streak across a UTC month boundary", () => {
    const current = makeStreak({ currentStreak: 1, longestStreak: 1, lastActivityDate: "2026-08-31" });
    const result = nextStreak(current, "2026-09-01");
    expect(result.currentStreak).toBe(2);
  });

  it("resets to 1 when a full UTC day is skipped", () => {
    const current = makeStreak({ currentStreak: 6, longestStreak: 6, lastActivityDate: "2026-08-12" });
    const result = nextStreak(current, "2026-08-14");
    expect(result).toEqual({ userId: "user-1", currentStreak: 1, longestStreak: 6, lastActivityDate: "2026-08-14" });
  });

  it("keeps the longest streak on record even after a reset", () => {
    const current = makeStreak({ currentStreak: 10, longestStreak: 10, lastActivityDate: "2026-08-01" });
    const result = nextStreak(current, "2026-08-10");
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(10);
  });

  it("grows the longest streak once the current streak surpasses it", () => {
    const current = makeStreak({ currentStreak: 6, longestStreak: 6, lastActivityDate: "2026-08-14" });
    const result = nextStreak(current, "2026-08-15");
    expect(result.currentStreak).toBe(7);
    expect(result.longestStreak).toBe(7);
  });
});
