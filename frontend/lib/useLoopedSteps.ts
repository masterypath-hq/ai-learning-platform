"use client";

import { useEffect, useState } from "react";

/** Advances 0 → totalSteps one step at a time, pauses, then loops. Frozen at the final step when `reduced` (prefers-reduced-motion). */
export function useLoopedSteps(totalSteps: number, stepMs: number, pauseMs: number, reduced: boolean): number {
  const [step, setStep] = useState(reduced ? totalSteps : 0);

  useEffect(() => {
    if (reduced) {
      setStep(totalSteps);
      return;
    }
    let cancelled = false;
    let i = 0;
    setStep(0);

    function tick() {
      if (cancelled) return;
      i++;
      setStep(i);
      if (i < totalSteps) {
        setTimeout(tick, stepMs);
      } else {
        setTimeout(() => {
          if (cancelled) return;
          i = 0;
          setStep(0);
          setTimeout(tick, stepMs);
        }, pauseMs);
      }
    }

    const t = setTimeout(tick, stepMs);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [totalSteps, stepMs, pauseMs, reduced]);

  return step;
}
