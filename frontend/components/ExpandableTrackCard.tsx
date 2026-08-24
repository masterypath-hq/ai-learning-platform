"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Clock, ChevronDown } from "lucide-react";
import clsx from "clsx";
import type { DisplayTrack } from "@ai-learning-platform/shared";
import { resolveTrackIcon, MASTERY_PHASES } from "@/lib/track-metadata";
import { Card } from "./Card";

export function ExpandableTrackCard({
  track,
  isExpanded,
  onHover,
  onToggle,
}: {
  track: DisplayTrack;
  isExpanded: boolean;
  onHover: () => void;
  onToggle: () => void;
}) {
  const Icon = resolveTrackIcon(track.icon);
  const reduced = useReducedMotion();

  return (
    <Card
      className={clsx(
        "cursor-pointer overflow-hidden p-0 transition-[border-color,box-shadow,transform] duration-300 hover:border-[var(--accent)]",
        isExpanded && "-translate-y-0.5 shadow-xl shadow-black/[0.06]"
      )}
      onMouseEnter={onHover}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)]">
            <Icon className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <h3 className="font-medium">{track.name}</h3>
            <span className="flex items-center gap-1 text-xs text-muted-2">
              <Clock className="h-3 w-3" />
              {track.estWeeksLabel}
            </span>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-2 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
      </div>

      <motion.div
        initial={false}
        animate={{ height: isExpanded ? "auto" : 0 }}
        transition={{ duration: reduced ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <div className="flex flex-col gap-4 px-5 pb-5">
          <p className="text-sm text-muted">{track.outcomeLine}</p>

          <ul className="flex flex-col gap-1.5 text-sm text-muted">
            {track.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
                {b}
              </li>
            ))}
          </ul>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-2">Your path</p>
            <div className="mt-2 flex items-center gap-1">
              {MASTERY_PHASES.map((phase, pi) => (
                <div key={phase} className="flex flex-1 items-center gap-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" style={{ opacity: 0.4 + pi * 0.2 }} />
                    <span className="text-center text-[10px] leading-tight text-muted">{phase}</span>
                  </div>
                  {pi < MASTERY_PHASES.length - 1 ? <div className="h-px flex-1 bg-[var(--accent)]/40" /> : null}
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/register"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]"
          >
            Start this track <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>
    </Card>
  );
}
