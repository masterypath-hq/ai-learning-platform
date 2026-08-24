export function Loader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-3 text-muted">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-border-strong border-t-[var(--accent)]" />
      {label ? <p className="text-sm">{label}</p> : null}
    </div>
  );
}
