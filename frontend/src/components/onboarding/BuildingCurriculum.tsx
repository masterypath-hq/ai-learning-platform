"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

export function BuildingCurriculum({
  courseName,
  level,
}: {
  courseName: string;
  level: string;
}) {
  const router = useRouter();

  useEffect(() => {
    // UI-first: simulate the AI build, then enter the dashboard. Replace this
    // timeout with the real curriculum-build endpoint (likely streamed
    // progress) once it's wired.
    const timer = setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 3800);
    return () => clearTimeout(timer);
  }, [router]);

  // Placeholder build steps — these will be driven by the backend later.
  const steps = [
    `Researching ${courseName}`,
    `Calibrating to ${level} level`,
    "Structuring modules & lessons",
    "Adding risk disclaimers",
  ];

  return (
    <div data-theme="auth" className="flex flex-col items-center gap-5 text-center">
      <div className="h-14 w-14 animate-spin rounded-full border-2 border-teal/25 border-t-teal" />

      <div>
        <h1 className="font-cormorant font-semibold text-[28px] leading-tight text-teal">
          Building your curriculum……
        </h1>
        <p className="mt-2 text-xs text-stone">
          Researching 30+ sources
          <br />
          Calibrating to your level
        </p>
      </div>

      <ul className="mt-2 flex w-full flex-col gap-3">
        {steps.map((label) => (
          <li
            key={label}
            className="flex items-center gap-3 rounded-xl border border-silver/60 bg-white px-4 py-3.5"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal text-white">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <span className="font-syne text-sm text-charcoal">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
