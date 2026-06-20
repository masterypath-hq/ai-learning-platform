"use client";

import { CheckCircle2, Circle, Lock, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";
import type { Module } from "@/types/learning";

interface CurriculumMapProps {
  modules: Module[];
}

const STATUS_ICON: Record<Module["status"], React.ReactNode> = {
  completed: <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-success)]" />,
  "in-progress": <PlayCircle className="h-4 w-4 shrink-0 text-[var(--color-accent)]" />,
  available: <Circle className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />,
  locked: <Lock className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" />,
};

export function CurriculumMap({ modules }: CurriculumMapProps) {
  const { progressMarkers, markModuleComplete } = useSessionStore();

  // Merge server status with optimistic local progress
  const enrichedModules = modules.map((m) => ({
    ...m,
    status: progressMarkers.includes(m.id) ? ("completed" as const) : m.status,
  }));

  const completedCount = enrichedModules.filter((m) => m.status === "completed").length;
  const progressPercent = Math.round((completedCount / enrichedModules.length) * 100);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-[var(--color-border)] p-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Curriculum
        </h2>
        <div className="mt-2 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span>{completedCount} / {enrichedModules.length} completed</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-raised)]">
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Module list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {enrichedModules.map((module, index) => (
          <div key={module.id} className="flex items-start gap-3">
            {/* Connector line */}
            <div className="flex flex-col items-center">
              <div className="mt-1">{STATUS_ICON[module.status]}</div>
              {index < enrichedModules.length - 1 && (
                <div className="mt-1 h-full min-h-5 w-px bg-[var(--color-border)]" />
              )}
            </div>

            {/* Content */}
            <button
              type="button"
              onClick={() => {
                if (module.status === "in-progress" || module.status === "available") {
                  markModuleComplete(module.id);
                }
              }}
              disabled={module.status === "locked"}
              className={cn(
                "mb-2 flex-1 rounded-lg border p-3 text-left transition-colors",
                module.status === "in-progress"
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-subtle)]"
                  : module.status === "completed"
                  ? "border-[var(--color-border)] bg-[var(--color-surface)] opacity-70"
                  : module.status === "locked"
                  ? "border-[var(--color-border)] bg-[var(--color-surface)] opacity-40 cursor-not-allowed"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/40"
              )}
            >
              <p className={cn(
                "text-xs font-medium",
                module.status === "in-progress"
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-text-primary)]"
              )}>
                {module.title}
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)] line-clamp-1">
                {module.description}
              </p>
              <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
                ~{module.estimatedHours}h
              </p>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
