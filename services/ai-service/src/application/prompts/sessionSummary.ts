import { z } from "zod";
import type { ChatMessageRole } from "@ai-learning-platform/shared";

export const SessionSummarySchema = z.object({
  summary: z.string().min(1),
  suggestedNextQuestions: z.array(z.string().min(1)).min(3).max(5),
});
export type SessionSummary = z.infer<typeof SessionSummarySchema>;

interface SummaryMessage {
  role: ChatMessageRole;
  content: string;
}

/** JSON-output prompt closing out a chat session (Stage 3). Zod-validated by the caller. */
export function buildSessionSummaryPrompt(messages: SummaryMessage[], validationError?: string): string {
  const transcript = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");

  const retryNote = validationError
    ? `\n\nYour previous response failed validation with this error: "${validationError}". Return
only corrected JSON this time.`
    : "";

  return `Summarize the following AI-tutoring conversation for the learner's session history.

Respond with ONLY a JSON object (no markdown fences, no prose) matching exactly this shape:
{"summary": "3-5 sentence summary of what was covered and how the learner did", "suggestedNextQuestions": ["question 1", "question 2", "question 3"]}

Rules:
- "summary" is 3-5 sentences written about the learner's session, not addressed to them.
- "suggestedNextQuestions" has 3-5 short, concrete questions the learner could ask next to build on
  this session.

Conversation:
${transcript}${retryNote}`;
}
