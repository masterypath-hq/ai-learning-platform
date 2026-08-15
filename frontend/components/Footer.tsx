import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px [animation:shimmer-line_5s_linear_infinite] [background-image:linear-gradient(90deg,transparent,var(--accent),transparent)] [background-repeat:no-repeat] [background-size:50%_100%] motion-reduce:[animation:none]"
      />

      <ScrollReveal className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="font-display text-3xl font-medium tracking-tight">Ready to actually learn this?</h2>
        <p className="mt-3 text-muted">Free to start. No card, no catch — just a real placement and a real tutor.</p>
        <Link
          href="/register"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--accent-foreground)] transition-transform hover:scale-[1.03] hover:bg-[var(--accent-hover)] active:scale-[0.98]"
        >
          Start learning free <ArrowRight className="h-4 w-4" />
        </Link>
      </ScrollReveal>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <div className="flex items-center gap-1.5 text-sm font-medium text-muted">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            MasteryPath
          </div>
          <nav className="flex items-center gap-6 text-sm text-muted">
            <FooterLink href="/pricing">Pricing</FooterLink>
            <FooterLink href="/login">Log in</FooterLink>
            <FooterLink href="/register">Get started</FooterLink>
          </nav>
          <p className="text-xs text-muted-2">© {new Date().getFullYear()} MasteryPath</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="relative transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-[var(--accent)] after:transition-[width] after:duration-300 hover:after:w-full"
    >
      {children}
    </Link>
  );
}
