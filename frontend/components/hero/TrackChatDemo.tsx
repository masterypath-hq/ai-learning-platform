"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Bot } from "lucide-react";
import clsx from "clsx";
import { HERO_SCRIPTS } from "@/lib/hero-scripts";
import { renderInlineCode } from "@/lib/renderInlineCode";
import { Card } from "@/components/Card";

const CHAR_MS = 16;
const PAUSE_AFTER_MS = 1800;

export function TrackChatDemo({ trackIndex, onSelectTrack }: { trackIndex: number; onSelectTrack: (i: number) => void }) {
  const reduced = !!useReducedMotion();
  const [exchangeIndex, setExchangeIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const script = HERO_SCRIPTS[trackIndex];
  const exchange = script.chat[exchangeIndex];

  useEffect(() => {
    setExchangeIndex(0);
  }, [trackIndex]);

  useEffect(() => {
    if (reduced) {
      setShowQuestion(true);
      setTypedAnswer(exchange.answer);
      setIsTyping(false);
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let charInterval: ReturnType<typeof setInterval> | null = null;

    setShowQuestion(false);
    setTypedAnswer("");
    setIsTyping(false);

    timers.push(setTimeout(() => !cancelled && setShowQuestion(true), 300));
    timers.push(
      setTimeout(() => {
        if (cancelled) return;
        setIsTyping(true);
        let i = 0;
        charInterval = setInterval(() => {
          i += 2;
          setTypedAnswer(exchange.answer.slice(0, i));
          if (i >= exchange.answer.length) {
            if (charInterval) clearInterval(charInterval);
            setIsTyping(false);
            timers.push(
              setTimeout(() => {
                if (!cancelled) setExchangeIndex((prev) => (prev + 1) % script.chat.length);
              }, PAUSE_AFTER_MS)
            );
          }
        }, CHAR_MS);
      }, 1100)
    );

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      if (charInterval) clearInterval(charInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackIndex, exchangeIndex, reduced]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1">
        {HERO_SCRIPTS.map((s, i) => (
          <button
            key={s.slug}
            onClick={() => onSelectTrack(i)}
            className={clsx(
              "rounded-full px-2.5 py-1 text-[11px] font-medium leading-none transition-colors",
              i === trackIndex
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "bg-surface-raised text-muted hover:text-foreground"
            )}
          >
            {s.title}
          </button>
        ))}
      </div>

      <Card className="relative overflow-hidden p-0" data-subject="programming">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent-soft)]">
            <Bot className="h-3.5 w-3.5 text-[var(--accent)]" />
          </div>
          <span className="text-sm font-medium">AI Tutor · {script.title}</span>
        </div>
        <div className="flex min-h-[15rem] flex-col justify-end gap-3 p-4">
          {showQuestion ? (
            <div className="ml-auto max-w-[80%] rounded-xl bg-[var(--accent)] px-3.5 py-2 text-sm text-[var(--accent-foreground)]">
              {exchange.question}
            </div>
          ) : null}
          {typedAnswer || isTyping ? (
            <div className="max-w-[85%] rounded-xl bg-surface-raised px-3.5 py-2 text-sm text-foreground">
              {renderInlineCode(typedAnswer)}
              {isTyping ? <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-foreground/50 align-middle" /> : null}
            </div>
          ) : null}
        </div>
      </Card>

      <p className="mt-3 text-center text-xs text-muted-2">
        This is a scripted preview — the real tutor adapts to you.
      </p>
    </div>
  );
}
