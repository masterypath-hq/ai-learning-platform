import { CreateChatSessionRequestSchema, type CreateChatSessionRequest } from "@ai-learning-platform/shared";

export function parseCreateChatSessionRequest(
  body: unknown
): { ok: true; request: CreateChatSessionRequest } | { ok: false; error: string } {
  const parsed = CreateChatSessionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }
  return { ok: true, request: parsed.data };
}
