"use client";

import { useState } from "react";
import type { ChatSession } from "@ai-learning-platform/shared";
import { useChatSessions } from "@/lib/queries/chat";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { Loader } from "@/components/Loader";

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

/** History of past lesson chats — every session originates from clicking a lesson, so there's no
 *  "start a new conversation" form here; this page is a read/resume view onto that history. */
export default function ChatPage() {
  const { data: sessions, isLoading: sessionsLoading } = useChatSessions();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const activeSession = sessions?.find((s) => s.id === activeSessionId) ?? null;
  const sessionGroups = groupSessions(sessions ?? []);

  return (
    <div className="grid h-[calc(100vh-6rem)] grid-cols-1 gap-4 sm:grid-cols-[260px_1fr]">
      <div className="flex flex-col gap-4 overflow-y-auto sm:pr-2">
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
          <p className="px-3 text-sm text-muted">No conversations yet — open a lesson to start one.</p>
        ) : null}
      </div>

      <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface">
        {!activeSession ? (
          <div className="flex flex-1 items-center justify-center text-muted">Select a conversation.</div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <div>
                <p className="font-display text-base font-medium">{activeSession.topic || activeSession.track}</p>
                <p className="text-xs capitalize text-muted">{activeSession.subjectArea}</p>
              </div>
            </div>
            <ChatPanel session={activeSession} />
          </>
        )}
      </div>
    </div>
  );
}
