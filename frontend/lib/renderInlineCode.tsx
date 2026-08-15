/** Splits `text` on backtick-delimited spans and renders them as inline <code>. */
export function renderInlineCode(text: string): React.ReactNode[] {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) =>
    part.startsWith("`") && part.endsWith("`") ? (
      <code key={i} className="rounded bg-background px-1 py-0.5 text-xs">
        {part.slice(1, -1)}
      </code>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}
