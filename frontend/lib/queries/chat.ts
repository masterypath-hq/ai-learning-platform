import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChatSession, ChatMessage } from "@ai-learning-platform/shared";
import { apiFetch } from "../api-client";

interface Envelope<T> {
  success: boolean;
  data: T;
  error: unknown;
}

export function useChatSessions() {
  return useQuery({
    queryKey: ["chat-sessions"],
    queryFn: () => apiFetch<Envelope<ChatSession[]>>("/api/ai/chat/sessions").then((r) => r.data),
  });
}

export function useChatMessages(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["chat-messages", sessionId],
    queryFn: () => apiFetch<Envelope<ChatMessage[]>>(`/api/ai/chat/sessions/${sessionId}/messages`).then((r) => r.data),
    enabled: !!sessionId,
  });
}

/** Idempotent: the server resumes the lesson's still-open session instead of duplicating it. */
export function useCreateChatSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { lessonId: string }) =>
      apiFetch<Envelope<ChatSession>>("/api/ai/chat/sessions", { method: "POST", body: input }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    },
  });
}

export interface SendChatMessageResult {
  message: ChatMessage;
  remaining: number | null;
  limit: number | null;
}

/** Triggers the tutor's opening message for a freshly created/resumed session with no messages
 *  yet. Fire-and-forget — the reply streams over the socket like any other assistant turn. */
export function useStartLessonConversation() {
  return useMutation({
    mutationFn: (sessionId: string) =>
      apiFetch<Envelope<null>>(`/api/ai/chat/sessions/${sessionId}/start`, { method: "POST" }),
  });
}

export function useSendChatMessage() {
  return useMutation({
    mutationFn: async (input: { sessionId: string; content: string }): Promise<SendChatMessageResult> => {
      let remaining: number | null = null;
      let limit: number | null = null;
      const res = await apiFetch<Envelope<ChatMessage>>(
        `/api/ai/chat/sessions/${input.sessionId}/messages`,
        { method: "POST", body: { content: input.content } },
        (headers) => {
          const r = headers.get("X-RateLimit-Remaining");
          const l = headers.get("X-RateLimit-Limit");
          remaining = r !== null ? Number(r) : null;
          limit = l !== null ? Number(l) : null;
        }
      );
      return { message: res.data, remaining, limit };
    },
  });
}

export function useCloseChatSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      apiFetch<Envelope<ChatSession>>(`/api/ai/chat/sessions/${sessionId}/close`, { method: "POST" }).then(
        (r) => r.data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    },
  });
}
