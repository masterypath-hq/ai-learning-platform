import { SendChatMessageRequestSchema, type SendChatMessageRequest } from "@ai-learning-platform/shared";

export function parseSendChatMessageRequest(
  body: unknown
): { ok: true; request: SendChatMessageRequest } | { ok: false; error: string } {
  const parsed = SendChatMessageRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }
  return { ok: true, request: parsed.data };
}
