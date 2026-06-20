import { Check, Lock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type ModuleStatus = "done" | "in-progress" | "locked";

export type Module = {
  id: string;
  index: number;
  title: string;
  lessonsLabel: string;
  status: ModuleStatus;
  progress: number; // 0–100
};

export function ModuleCard({ module }: { module: Module }) {
  const { status } = module;
  const done = status === "done";
  const locked = status === "locked";

  return (
    <div
      className={cn(
        "flex min-h-[150px] flex-col justify-between gap-10 rounded-xl border p-4",
        done && "border-transparent bg-teal text-white",
        status === "in-progress" && "border-divider bg-white",
        locked && "border-divider bg-blush/40"
      )}
    >
      {/* Top: lesson count + status badge */}
      <div className="flex items-start justify-between">
        <span className={cn("text-xs", done ? "text-white/70" : "text-stone")}>
          {module.lessonsLabel}
        </span>
        <StatusBadge status={status} />
      </div>

      {/* Bottom: title + progress */}
      <div>
        <p
          className={cn(
            "text-sm font-semibold",
            done ? "text-white" : locked ? "text-stone" : "text-teal"
          )}
        >
          {done && `Module ${module.index} · Complete`}
          {locked && `Module ${module.index} · Locked`}
          {status === "in-progress" && (
            <>
              Module {module.index} · Continue{" "}
              <ArrowRight className="inline h-3.5 w-3.5" />
            </>
          )}
        </p>
        <p className={cn("mt-1 text-xs", done ? "text-white/70" : "text-stone")}>
          {module.title}
        </p>
        <div
          className={cn(
            "mt-3 h-1 w-full overflow-hidden rounded-full",
            done ? "bg-white/20" : "bg-divider"
          )}
        >
          <div
            className={cn("h-full rounded-full", done ? "bg-white" : "bg-teal")}
            style={{ width: `${module.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ModuleStatus }) {
  if (status === "in-progress") {
    return (
      <span className="rounded-full bg-teal/10 px-2.5 py-1 text-[10px] font-medium text-teal">
        In progress
      </span>
    );
  }
  if (status === "locked") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-medium text-stone">
        <Lock className="h-2.5 w-2.5" />
        Locked
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-medium text-white">
      <Check className="h-2.5 w-2.5" strokeWidth={3} />
      Done
    </span>
  );
}
