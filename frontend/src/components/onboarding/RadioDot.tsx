import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Circular selection indicator used across the onboarding steps.
export function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
        selected ? "border-teal bg-teal text-white" : "border-silver bg-white"
      )}
    >
      {selected && <Check className="h-3 w-3" strokeWidth={3} />}
    </span>
  );
}
