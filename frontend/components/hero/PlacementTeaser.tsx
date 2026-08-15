"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { HERO_SCRIPTS, RESULT_LEVEL_LABELS } from "@/lib/hero-scripts";
import { Card } from "@/components/Card";

export function PlacementTeaser({ trackIndex }: { trackIndex: number }) {
  const script = HERO_SCRIPTS[trackIndex];
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    setAnswers([null, null, null]);
    setCurrent(0);
  }, [trackIndex]);

  const done = answers.every((a) => a !== null);

  function selectAnswer(optionIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = optionIndex;
      return next;
    });
    if (current < 2) {
      setTimeout(() => setCurrent((c) => c + 1), 350);
    }
  }

  return (
    <Card className="mt-6">
      <p className="font-display text-base font-medium">Find your real level in 30 seconds</p>
      <p className="mt-0.5 text-xs text-muted-2">Based on the {script.title} track — pick a track above to change it.</p>

      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
            className="mt-4"
          >
            <p className="mb-2 text-xs text-muted-2">
              Question {current + 1} of {script.placement.length}
            </p>
            <p className="text-sm font-medium">{script.placement[current].prompt}</p>
            <div className="mt-3 grid gap-1.5">
              {script.placement[current].options.map((opt, i) => (
                <button
                  key={opt}
                  onClick={() => selectAnswer(i)}
                  className="rounded-lg border border-border-strong px-3 py-2 text-left text-sm hover:border-[var(--accent)]"
                >
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 rounded-lg bg-[var(--accent-soft)] p-4"
          >
            <div className="flex items-center gap-2">
              {answers.every((a, i) => a === script.placement[i].correctIndex) ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <XCircle className="h-4 w-4 text-[var(--accent)]" />
              )}
              <p className="text-sm font-medium">
                You&apos;d start at {RESULT_LEVEL_LABELS[script.resultLevel]} · {script.resultModule}
              </p>
            </div>
            <Link
              href={`/register?track=${script.slug}&level=${script.resultLevel}`}
              className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]"
            >
              Start there free <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
