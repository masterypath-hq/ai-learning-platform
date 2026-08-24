import Link from "next/link";
import { Sparkles, ArrowRight, Rss, Code2 } from "lucide-react";
import { TRACK_CATEGORY_ORDER, TRACK_CATEGORY_LABELS } from "@ai-learning-platform/shared";
import { ScrollReveal } from "./ScrollReveal";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#1b3a32] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px [animation:shimmer-line_5s_linear_infinite] [background-image:linear-gradient(90deg,transparent,rgba(247,242,233,0.6),transparent)] [background-repeat:no-repeat] [background-size:50%_100%] motion-reduce:[animation:none]"
      />

      <ScrollReveal className="mx-auto max-w-4xl px-4 py-14 text-center md:py-24">
        <h2 className="font-display text-3xl font-medium tracking-tight">Ready to actually learn this?</h2>
        <p className="mt-3 text-white/70">Free to start. No card, no catch — just a real placement and a real tutor.</p>
        <Link
          href="/register"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-medium text-[#1b3a32] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 active:translate-y-0"
        >
          Start learning free <ArrowRight className="h-4 w-4" />
        </Link>
      </ScrollReveal>

      <div className="border-t border-white/10">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-white/70" />
              MasteryPath
            </div>
            <p className="mt-3 max-w-[22ch] text-sm text-white/60">
              An AI tutor that takes you from zero to job-ready — one placed, proven step at a time.
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/40">Tracks</p>
            <nav className="mt-3 flex flex-col gap-2 text-sm text-white/70">
              {TRACK_CATEGORY_ORDER.map((category) => (
                <FooterLink key={category} href="/#tracks">
                  {TRACK_CATEGORY_LABELS[category]}
                </FooterLink>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/40">Company</p>
            <nav className="mt-3 flex flex-col gap-2 text-sm text-white/70">
              <FooterLink href="/pricing">Pricing</FooterLink>
              <FooterLink href="/login">Log in</FooterLink>
              <FooterLink href="/register">Get started</FooterLink>
            </nav>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/40">Follow along</p>
            <p className="mt-3 text-sm text-white/60">Building MasteryPath in public — links coming soon.</p>
            <div className="mt-3 flex items-center gap-2">
              <span
                title="Build-in-public updates — coming soon"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/40"
              >
                <Rss className="h-3.5 w-3.5" />
              </span>
              <span
                title="Open-source bits — coming soon"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/40"
              >
                <Code2 className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-white/40">© {new Date().getFullYear()} MasteryPath</p>
          <p className="text-xs text-white/40">Finance & Trading — coming soon</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="relative w-fit transition-colors hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-white after:transition-[width] after:duration-300 hover:after:w-full"
    >
      {children}
    </Link>
  );
}
