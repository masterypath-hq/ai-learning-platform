import type { GradedQuizType } from "@ai-learning-platform/shared";

/** CLAUDE.md product rules: module quiz fail → 24h cool-down; course final fail → 48h. */
export const COOLDOWN_HOURS: Record<GradedQuizType, number> = {
  module_quiz: 24,
  course_final: 48,
};

export function cooldownEndsAt(type: GradedQuizType, from: Date): Date {
  return new Date(from.getTime() + COOLDOWN_HOURS[type] * 60 * 60 * 1000);
}
