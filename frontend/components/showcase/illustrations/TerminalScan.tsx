"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLoopedSteps } from "@/lib/useLoopedSteps";

const LINES = [
  "$ scan --target 10.0.0.4/24",
  "→ checking open ports...",
  "→ checking known CVEs...",
  "⚠ 3 findings",
  "$ patch --auto",
  "✓ 3 findings → patched",
];

export function TerminalScan() {
  const reduced = !!useReducedMotion();
  const visible = useLoopedSteps(LINES.length, 500, 2200, reduced);

  return (
    <div className="h-48 rounded-xl border border-white/15 bg-black/30 p-4 font-mono text-xs">
      <div className="mb-3 flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
      </div>
      <div className="flex flex-col gap-1.5">
        {LINES.slice(0, visible).map((line, i) => (
          <p key={i} className={line.startsWith("✓") ? "text-emerald-300" : line.startsWith("⚠") ? "text-amber-300" : "text-white/85"}>
            {line}
          </p>
        ))}
        {!reduced ? (
          <motion.span
            className="h-3.5 w-1.5 bg-white/80"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        ) : null}
      </div>
    </div>
  );
}
