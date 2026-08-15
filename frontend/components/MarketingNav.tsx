import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-1.5 font-display text-lg font-medium">
          <Sparkles className="h-5 w-5 text-[var(--accent)]" />
          MasteryPath
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link href="/pricing" className="hidden text-sm text-muted hover:text-foreground sm:inline">
            Pricing
          </Link>
          <Link href="/login" className="hidden text-sm text-muted hover:text-foreground sm:inline">
            Log in
          </Link>
          <ThemeToggle />
          <Link
            href="/register"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
