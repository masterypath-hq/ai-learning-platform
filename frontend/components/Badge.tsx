import clsx from "clsx";

type Tone = "accent" | "success" | "danger" | "warning" | "neutral";

export function Badge({ tone = "neutral", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "accent" && "bg-[var(--accent-soft)] text-[var(--accent)]",
        tone === "success" && "bg-success/10 text-success",
        tone === "danger" && "bg-danger/10 text-danger",
        tone === "warning" && "bg-warning/10 text-warning",
        tone === "neutral" && "bg-surface-raised text-muted",
        className
      )}
      {...props}
    />
  );
}
