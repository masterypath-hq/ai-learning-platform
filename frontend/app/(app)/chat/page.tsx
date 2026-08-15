"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { io, type Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Plus, Send, X } from "lucide-react";
import type { ChatMessage, ChatSession, ChatSubjectArea } from "@ai-learning-platform/shared";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError } from "@/lib/api-client";
import {
  useChatSessions,
  useChatMessages,
  useCreateChatSession,
  useSendChatMessage,
  useCloseChatSession,
} from "@/lib/queries/chat";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Loader } from "@/components/Loader";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4001";

type ChatEvent = { type: "token"; text: string } | { type: "done" } | { type: "error"; message: string };

function groupSessions(sessions: ChatSession[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);

  const groups: { label: string; items: ChatSession[] }[] = [
    { label: "Today", items: [] },
    { label: "This week", items: [] },
    { label: "Earlier", items: [] },
  ];
  for (const s of sessions) {
    const created = new Date(s.createdAt);
    if (created >= startOfToday) groups[0].items.push(s);
    else if (created >= startOfWeek) groups[1].items.push(s);
    else groups[2].items.push(s);
  }
  return groups.filter((g) => g.items.length > 0);
}

export default function ChatPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const planTier = useAuthStore((s) => s.planTier);
  const { data: sessions, isLoading: sessionsLoading } = useChatSessions();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);

  const activeSession = sessions?.find((s) => s.id === activeSessionId) ?? null;
  const { data: persistedMessages } = useChatMessages(activeSessionId ?? undefined);

  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState("");
  const [rateLimit, setRateLimit] = useState<{ remaining: number; limit: number } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const createSession = useCreateChatSession();
  const sendMessage = useSendChatMessage();
  const closeSession = useCloseChatSession();

  // One socket connection for the page; join/leave rooms as the active session changes.
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
                sessionId: activeSessionId ?? "",
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

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    if (activeSessionId) socketRef.current?.emit("join_session", { sessionId: activeSessionId });
  }, [activeSessionId]);

  useEffect(() => {
    setLiveMessages(persistedMessages ?? []);
  }, [persistedMessages, activeSessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveMessages, streamingText]);

  async function handleCreateSession(subjectArea: ChatSubjectArea, track: string, topic: string) {
    const session = await createSession.mutateAsync({ subjectArea, track, topic: topic || undefined });
    setActiveSessionId(session.id);
    setShowNewChat(false);
  }

  async function handleSend() {
    if (!activeSessionId || !input.trim() || isStreaming) return;
    setSendError(null);
    const content = input;
    setInput("");

    try {
      const { message, remaining, limit } = await sendMessage.mutateAsync({ sessionId: activeSessionId, content });
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

  const sessionGroups = groupSessions(sessions ?? []);

  return (
    <div className="grid h-[calc(100vh-6rem)] grid-cols-1 gap-4 sm:grid-cols-[260px_1fr]">
      <div className="flex flex-col gap-4 overflow-y-auto sm:pr-2">
        <Button onClick={() => setShowNewChat(true)}>
          <Plus className="h-4 w-4" /> New session
        </Button>
        {sessionsLoading ? (
          <Loader />
        ) : (
          sessionGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-2">{group.label}</p>
              <div className="flex flex-col gap-1">
                {group.items.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSessionId(s.id)}
                    className={`flex flex-col items-start rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      s.id === activeSessionId ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-muted hover:bg-surface-hover"
                    }`}
                  >
                    <span className="font-medium">{s.topic || s.track}</span>
                    <span className="text-xs text-muted-2">
                      {s.track} · {new Date(s.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
        {!sessionsLoading && (sessions?.length ?? 0) === 0 ? (
          <p className="px-3 text-sm text-muted">No conversations yet.</p>
        ) : null}
      </div>

      <div
        className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface"
        data-subject={activeSession?.subjectArea}
      >
        {showNewChat ? (
          <NewChatForm onCancel={() => setShowNewChat(false)} onCreate={handleCreateSession} isLoading={createSession.isPending} />
        ) : !activeSession ? (
          <div className="flex flex-1 items-center justify-center text-muted">Select or start a conversation.</div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <div>
                <p className="font-display text-base font-medium">{activeSession.topic || activeSession.track}</p>
                <p className="text-xs capitalize text-muted">{activeSession.subjectArea}</p>
              </div>
              {!activeSession.closedAt ? (
                <Button size="sm" variant="ghost" onClick={() => closeSession.mutate(activeSession.id)}>
                  <X className="h-4 w-4" /> End session
                </Button>
              ) : null}
            </div>

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
              {activeSession.closedAt && activeSession.suggestedNextQuestions.length > 0 ? (
                <Card>
                  <p className="text-sm font-medium">Suggested next questions</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {activeSession.suggestedNextQuestions.map((q) => (
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
                  disabled={!!activeSession.closedAt}
                  placeholder={activeSession.closedAt ? "This session is closed." : "Ask anything about this module"}
                  className="h-11 flex-1 rounded-full border border-border-strong bg-background px-4 text-sm outline-none focus:border-[var(--accent)] disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isStreaming || !!activeSession.closedAt}
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
          </>
        )}
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

function NewChatForm({
  onCancel,
  onCreate,
  isLoading,
}: {
  onCancel: () => void;
  onCreate: (subjectArea: ChatSubjectArea, track: string, topic: string) => void;
  isLoading: boolean;
}) {
  const [subjectArea, setSubjectArea] = useState<ChatSubjectArea>("programming");
  const [track, setTrack] = useState("");
  const [topic, setTopic] = useState("");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <div className="w-full max-w-sm">
        <h2 className="font-display text-xl font-medium">Start a new conversation</h2>
        <div className="mt-4 flex flex-col gap-3">
          <div>
            <label className="text-sm text-muted">Subject area</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {(["programming", "finance"] as ChatSubjectArea[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSubjectArea(s)}
                  className={`rounded-lg border px-3 py-2 text-sm capitalize ${
                    subjectArea === s ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-border-strong"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-muted" htmlFor="track">
              Track
            </label>
            <input
              id="track"
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              placeholder="e.g. cybersecurity, forex-trading"
              className="mt-1 h-10 w-full rounded-lg border border-border-strong bg-background px-3 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="text-sm text-muted" htmlFor="topic">
              Topic (optional)
            </label>
            <input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What do you want to learn about?"
              className="mt-1 h-10 w-full rounded-lg border border-border-strong bg-background px-3 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button disabled={!track.trim()} isLoading={isLoading} onClick={() => onCreate(subjectArea, track, topic)}>
              Start
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
