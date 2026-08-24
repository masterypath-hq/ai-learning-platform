/**
 * AI tutor chat contracts (Stage 3). Zod-validated.
 */
import { z } from "zod";

export const ChatSubjectAreaSchema = z.enum(["finance", "programming"]);
export type ChatSubjectArea = z.infer<typeof ChatSubjectAreaSchema>;

export const ChatMessageRoleSchema = z.enum(["user", "assistant"]);
export type ChatMessageRole = z.infer<typeof ChatMessageRoleSchema>;

/**
 * Every session is now created for one specific lesson — the server derives subjectArea/track/
 * topic/learnerProfile from it (see CreateChatSessionAction) instead of accepting them from the
 * client, so a chat session can never be created disconnected from real course content.
 */
export const CreateChatSessionRequestSchema = z.object({
  lessonId: z.string().uuid(),
});
export type CreateChatSessionRequest = z.infer<typeof CreateChatSessionRequestSchema>;

export const ChatSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  subjectArea: ChatSubjectAreaSchema,
  track: z.string(),
  topic: z.string().nullable(),
  learnerProfile: z.string().nullable(),
  /** Null only for sessions created before lesson-scoping shipped. */
  lessonId: z.string().nullable(),
  summary: z.string().nullable(),
  suggestedNextQuestions: z.array(z.string()),
  createdAt: z.string(),
  closedAt: z.string().nullable(),
});
export type ChatSession = z.infer<typeof ChatSessionSchema>;

export const SendChatMessageRequestSchema = z.object({
  content: z.string().min(1),
});
export type SendChatMessageRequest = z.infer<typeof SendChatMessageRequestSchema>;

export const ChatMessageSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  role: ChatMessageRoleSchema,
  content: z.string(),
  createdAt: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
