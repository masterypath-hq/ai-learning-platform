"use client";

import { motion, useReducedMotion } from "framer-motion";

const NODES = [
  { label: "User", pos: 8 },
  { label: "Agent", pos: 36 },
  { label: "Tools", pos: 64 },
  { label: "Response", pos: 92 },
];

export function NodeGraphPulse() {
  const reduced = useReducedMotion();

  return (
    <div className="relative h-48 rounded-xl border border-white/15 bg-black/20 px-6 pt-16">
      <div className="relative h-px w-full bg-white/15">
        {!reduced ? (
          <motion.span
            className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#8ad1b2]"
            style={{ boxShadow: "0 0 8px 2px rgba(138,209,178,0.6)" }}
            animate={{ left: NODES.map((n) => `${n.pos}%`) }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : null}
        {NODES.map((n) => (
          <div
            key={n.label}
            className="absolute top-0 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
            style={{ left: `${n.pos}%` }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-[10px] font-medium text-white">
              {n.label[0]}
            </div>
            <span className="whitespace-nowrap text-[10px] text-white/60">{n.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
