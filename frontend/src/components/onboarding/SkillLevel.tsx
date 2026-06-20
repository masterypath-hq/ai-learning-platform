"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { RadioDot } from "./RadioDot";

type Level = { id: string; name: string; blurb: string };

const LEVELS: Level[] = [
  { id: "beginner", name: "Complete beginner", blurb: "Never studied this before. Starting from scratch." },
  { id: "some-basics", name: "Some basics", blurb: "Know a bit but have gaps. Need real structure." },
  { id: "intermediate", name: "Intermediate", blurb: "Comfortable with the core. Ready to go deeper." },
  { id: "advanced", name: "Advanced", blurb: "Strong foundation. Want to specialize and master." },
];

// Sample calibration question — should be driven by the backend per subject.
const CALIBRATION = {
  prompt:
    "EUR/USD is quoted at 1.0850. You sell 10,000 EUR. How much USD do you receive?",
  options: [
    { id: "a", label: "$10,850" },
    { id: "b", label: "$9,216.59" },
    { id: "c", label: "I don't know yet" },
  ],
};

export function SkillLevel({ onContinue }: { onContinue: (level: string) => void }) {
  const [levelId, setLevelId] = useState<string | null>("beginner");
  const [answerId, setAnswerId] = useState<string | null>(null);

  function handleContinue() {
    const level = LEVELS.find((l) => l.id === levelId);
    if (!level) return;
    onContinue(level.name.toLowerCase());
  }

  return (
    <div data-theme="auth" className="flex flex-col gap-6">
      {/* Header */}
      <div className="pr-10">
        <h1 className="font-cormorant font-semibold text-[28px] leading-tight text-teal">
          How well do you know it?
        </h1>
        <p className="mt-1 text-sm font-normal text-stone">
          Be honest — this sets your starting point. The AI recalibrates as you learn.
        </p>
      </div>

      {/* Level cards */}
      <div className="grid grid-cols-2 gap-4">
        {LEVELS.map((lvl) => {
          const selected = lvl.id === levelId;
          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => setLevelId(lvl.id)}
              className={cn(
                "flex flex-col gap-3 rounded-xl border bg-white p-4 text-left transition-colors",
                selected ? "border-teal" : "border-silver/60 hover:border-stone"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-syne font-semibold text-base text-teal">
                  {lvl.name}
                </p>
                <RadioDot selected={selected} />
              </div>
              <p className="text-xs text-stone">{lvl.blurb}</p>
            </button>
          );
        })}
      </div>

      {/* Quick calibration */}
      <div className="rounded-xl border border-silver/60 bg-white p-5">
        <p className="font-syne font-semibold text-base text-teal">Quick calibration</p>
        <p className="mt-1 text-xs text-stone">{CALIBRATION.prompt}</p>
        <ul className="mt-4 flex flex-col gap-3">
          {CALIBRATION.options.map((opt) => {
            const selected = opt.id === answerId;
            return (
              <li key={opt.id}>
                <button
                  type="button"
                  onClick={() => setAnswerId(opt.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border bg-white px-4 py-3 text-left transition-colors",
                    selected ? "border-teal" : "border-silver/60 hover:border-stone"
                  )}
                >
                  <span className="font-syne text-sm text-charcoal">{opt.label}</span>
                  <RadioDot selected={selected} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleContinue}
        disabled={!levelId}
        className="h-12.25 w-full rounded-md bg-teal font-syne text-base text-white transition-colors hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        Build my curriculum
      </button>
    </div>
  );
}
