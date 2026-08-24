"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { io, type Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Send, X } from "lucide-react";
import type { ChatMessage, ChatSession } from "@ai-learning-platform/shared";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError } from "@/lib/api-client";
import { useChatMessages, useSendChatMessage, useCloseChatSession, useStartLessonConversation } from "@/lib/queries/chat";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4001";

type ChatEvent = { type: "token"; text: string } | { type: "done" } | { type: "error"; message: string };

/** The live chat surface for one session — socket streaming, message history, and the composer.
 *  Shared by the standalone /chat history view and the lesson-scoped chat entry point. */
export function ChatPanel({ session }: { session: ChatSession }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const planTier = useAuthStore((s) => s.planTier);
  const { data: persistedMessages } = useChatMessages(session.id);

  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState("");
  const [rateLimit, setRateLimit] = useState<{ remaining: number; limit: number } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sendMessage = useSendChatMessage();
  const closeSession = useCloseChatSession();
  const startConversation = useStartLessonConversation();
  const startTriggeredRef = useRef(false);

  useEffect(() => {
    if (!accessToken) return;
    const socket = io(WS_URL, { auth: { token: accessToken } });
    socketRef.current = socket;

    socket.on("chat_event", (event: ChatEvent) => {
      if (event.type === "token") {
        setStreamingText((prev) => prev + event.text);
      } else if (event.type === "done") {
        setIsStreaming(false);
        setStreamingText((finalText) => {
          if (finalText) {
            setLiveMessages((prev) => [
              ...prev,
              {
                id: `local-${Date.now()}`,
                sessionId: session.id,
                role: "assistant",
                content: finalText,
                createdAt: new Date().toISOString(),
              },
            ]);
          }
          return "";
        });
      } else if (event.type === "error") {
        setIsStreaming(false);
        setStreamingText("");
        setSendError(event.message);
      }
    });

    socket.emit("join_session", { sessionId: session.id });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, session.id]);

  useEffect(() => {
    setLiveMessages(persistedMessages ?? []);
  }, [persistedMessages, session.id]);

  // A brand-new session has no messages — trigger the tutor's opening turn so the AI starts
  // teaching immediately instead of the learner facing an empty chat.
  useEffect(() => {
    startTriggeredRef.current = false;
  }, [session.id]);

  useEffect(() => {
    if (persistedMessages === undefined) return;
    if (persistedMessages.length > 0) return;
    if (session.closedAt) return;
    if (startTriggeredRef.current) return;
    startTriggeredRef.current = true;

    setIsStreaming(true);
    startConversation.mutate(session.id, {
      onError: (err) => {
        // A concurrent trigger (e.g. another tab) already started it — not a real failure.
        if (err instanceof ApiError && err.status === 409) return;
        setIsStreaming(false);
        setSendError("Couldn't start the lesson. Please refresh.");
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistedMessages, session.id, session.closedAt]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveMessages, streamingText]);

  async function handleSend() {
    if (!input.trim() || isStreaming) return;
    setSendError(null);
    const content = input;
    setInput("");

    try {
      const { message, remaining, limit } = await sendMessage.mutateAsync({ sessionId: session.id, content });
      setLiveMessages((prev) => [...prev, message]);
      if (remaining !== null && limit !== null) setRateLimit({ remaining, limit });
      setIsStreaming(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setSendError("Daily free-tier message limit reached.");
      } else {
        setSendError("Couldn't send that message. Please try again.");
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden" data-subject={session.subjectArea}>
      {!session.closedAt ? (
        <div className="flex justify-end border-b border-border px-5 py-2.5">
          <Button size="sm" variant="ghost" onClick={() => closeSession.mutate(session.id)}>
            <X className="h-4 w-4" /> End session
          </Button>
        </div>
      ) : null}

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <AnimatePresence initial={false}>
          {liveMessages.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.2) }}
            >
              <MessageBubble message={m} />
            </motion.div>
          ))}
        </AnimatePresence>
        {isStreaming ? (
          <div className="max-w-[85%] rounded-2xl bg-surface-raised px-4 py-2.5 text-sm">
            <div className="prose-lesson">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {streamingText || "…"}
              </ReactMarkdown>
            </div>
          </div>
        ) : null}
        {session.closedAt && session.suggestedNextQuestions.length > 0 ? (
          <Card>
            <p className="text-sm font-medium">Suggested next questions</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {session.suggestedNextQuestions.map((q) => (
                <span key={q} className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs text-[var(--accent)]">
                  {q}
                </span>
              ))}
            </div>
          </Card>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {sendError ? <p className="px-5 text-sm text-danger">{sendError}</p> : null}

      <div className="border-t border-border p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!!session.closedAt}
            placeholder={session.closedAt ? "This session is closed." : "Ask anything about this lesson"}
            className="h-11 flex-1 rounded-full border border-border-strong bg-background px-4 text-sm outline-none focus:border-[var(--accent)] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming || !!session.closedAt}
            aria-label="Send"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        {rateLimit && planTier === "free" ? (
          <div className="mt-2.5 flex items-center gap-2">
            <div className="h-1 flex-1 rounded-full bg-surface-raised">
              <div
                className="h-1 rounded-full bg-[var(--accent)] transition-all"
                style={{ width: `${(rateLimit.remaining / rateLimit.limit) * 100}%` }}
              />
            </div>
            <span className="whitespace-nowrap text-xs text-muted-2">
              {rateLimit.remaining}/{rateLimit.limit} free today
            </span>
            <Link href="/pricing" className="whitespace-nowrap text-xs font-medium text-[var(--accent)]">
              Go unlimited
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
          isUser ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "bg-surface-raised"
        }`}
      >
        {isUser ? (
          message.content
        ) : (
          <div className="prose-lesson">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
