"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Square } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { useChatStream } from "@/hooks/use-chat-stream";
import { ChatMessage, StreamingMessage } from "./ChatMessage";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  sessionId: string;
  token: string | null;
}

export function ChatPanel({ sessionId, token }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, streamingContent, isStreaming } = useChatStore();
  const { sendMessage, stopStream } = useChatStream(sessionId, token);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  function handleSend() {
    const trimmed = inputValue.trim();
    if (!trimmed || isStreaming) return;
    sendMessage(trimmed);
    setInputValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInputValue(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  }

  const isEmpty = messages.length === 0 && !streamingContent;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center border-b border-[var(--color-border)] px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">AI Tutor</h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            {isStreaming ? "Thinking..." : "Ready to help"}
          </p>
        </div>
        {isStreaming && (
          <button
            onClick={stopStream}
            className="ml-auto flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-error)] hover:text-[var(--color-error)]"
          >
            <Square className="h-3 w-3 fill-current" /> Stop
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 text-4xl">🧠</div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Your AI tutor is ready
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Ask a question, request an explanation, or say &ldquo;let&apos;s start&rdquo;.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <StreamingMessage content={streamingContent} />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--color-border)] p-4">
        <div
          className={cn(
            "flex items-end gap-2 rounded-xl border bg-[var(--color-surface)] px-3 py-2 transition-colors",
            "focus-within:border-[var(--color-accent)]",
            "border-[var(--color-border)]"
          )}
        >
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask your tutor anything... (Enter to send)"
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none disabled:opacity-50 max-h-40"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isStreaming}
            className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white transition-opacity hover:opacity-90 disabled:opacity-30"
            aria-label="Send message"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-[var(--color-text-muted)]">
          Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}
