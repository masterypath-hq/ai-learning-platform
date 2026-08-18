"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Hammer,
  ClipboardCheck,
  TrendingUp,
  Mail,
  Check,
  Layers,
  BarChart3,
  Clock3,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { groupTracksForDisplay, TRACK_CATEGORY_ORDER, TRACK_CATEGORY_LABELS } from "@ai-learning-platform/shared";
import type { LessonResponse } from "@ai-learning-platform/shared";
import { useTracks } from "@/lib/queries/tracks";
import { MASTERY_PHASES } from "@/lib/track-metadata";
import { useJoinWaitlist } from "@/lib/queries/waitlist";
import { Card } from "@/components/Card";
import { PricingTable } from "@/components/PricingTable";
import { Footer } from "@/components/Footer";
import { Loader } from "@/components/Loader";
import { Marquee } from "@/components/Marquee";
import { ExpandableTrackCard } from "@/components/ExpandableTrackCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import { TrackChatDemo } from "@/components/hero/TrackChatDemo";
import { PlacementTeaser } from "@/components/hero/PlacementTeaser";
import { ProofSection } from "@/components/proof/ProofSection";

const VALUE_PROPS = [
  {
    icon: Bot,
    title: "An AI tutor that actually adapts",
    body: "It reads your first few messages, pitches explanations at your level, and goes deeper the moment you ask — not a fixed script.",
  },
  {
    icon: Hammer,
    title: "Learn by building, not watching",
    body: "Every lesson pairs worked examples with a practice exercise. You write the code — you don't just read about it.",
  },
  {
    icon: ClipboardCheck,
    title: "Quizzes that prove it stuck",
    body: "Knowledge checks are low-stakes and unlimited. Module quizzes have a real pass bar — fail one and you cool down before retrying.",
  },
  {
    icon: TrendingUp,
    title: "Progress you can actually see",
    body: "Streaks, badges, and a dashboard that shows exactly how far along each course you are — not a vague completion bar.",
  },
];

const STEPS = [
  {
    title: "Pick your track",
    body: "Live tracks across software engineering, data, cloud, ops, and fully native mobile — with Finance & Trading coming next.",
  },
  {
    title: "Get placed, not guessed",
    body: "A short placement question and a confidence check on core skills put you at the right starting point — not the beginning by default.",
  },
  {
    title: "Learn, then prove it",
    body: "Read the lesson, ask your AI tutor anything, work the practice exercise, then pass a quick knowledge check.",
  },
  {
    title: "Level up for real",
    body: "Clear a module quiz to move on. Your dashboard tracks streaks, badges, and exactly how far you've climbed.",
  },
];

export function LandingClient({ lessonPreview }: { lessonPreview: LessonResponse | null }) {
  const { data, isLoading } = useTracks();
  const courses = data?.tracks.flatMap((t) => t.courses) ?? [];
  const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);
  const [heroTrackIndex, setHeroTrackIndex] = useState(0);

  const liveSlugs = new Set(courses.map((c) => c.slug));
  const allDisplayTracks = groupTracksForDisplay();
  const displayTracks = isLoading
    ? allDisplayTracks
    : allDisplayTracks.filter((t) => (t.memberTrackIds?.some((id) => liveSlugs.has(id)) ?? liveSlugs.has(t.id)));
  const tracksByCategory = TRACK_CATEGORY_ORDER.map((category) => ({
    category,
    tracks: displayTracks.filter((t) => t.category === category),
  })).filter((group) => group.tracks.length > 0);

  return (
    <main>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="hero-glow" />
        <div aria-hidden className="dot-grid" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-14 pt-14 md:pb-20 md:pt-20 lg:grid-cols-2 lg:items-start lg:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-display text-4xl font-medium leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Go from <em className="italic">zero</em> to job-ready, guided by an AI tutor that knows where you are.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Pick a track, get placed at your real level, and learn through live AI chat, hands-on
              lessons, and quizzes that actually check understanding — not just watch-and-forget videos.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--accent-foreground)] transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-[var(--accent-hover)] hover:shadow-lg hover:shadow-[var(--accent)]/25 active:translate-y-0 active:scale-[0.98]"
              >
                Start learning free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#tracks"
                className="rounded-lg border border-border-strong px-6 py-3 text-sm font-medium transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-surface-hover"
              >
                See what&apos;s live
              </Link>
            </div>

            <PlacementTeaser trackIndex={heroTrackIndex} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <TrackChatDemo trackIndex={heroTrackIndex} onSelectTrack={setHeroTrackIndex} />
          </motion.div>
        </div>
      </section>

      <StatsBand trackCount={displayTracks.length} />

      {/* Why us */}
      <section className="border-t border-border py-14 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <ScrollReveal>
            <Eyebrow>Why MasteryPath</Eyebrow>
            <h2 className="mt-2 font-display text-3xl font-medium">Why learn here instead of another video course</h2>
            <p className="mt-2 max-w-2xl text-muted">
              Most platforms hand you a playlist. MasteryPath pairs one-on-one AI tutoring with the kind
              of practice and testing that makes it stick.
            </p>
          </ScrollReveal>
        </div>
        <div className="mt-10">
          <Marquee speed={38}>
            {VALUE_PROPS.map(({ icon: Icon, title, body }) => (
              <Card key={title} className="flex w-80 shrink-0 flex-col gap-3 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)]">
                  <Icon className="h-5 w-5 text-[var(--accent)]" />
                </div>
                <h3 className="font-medium">{title}</h3>
                <p className="text-sm text-muted">{body}</p>
              </Card>
            ))}
          </Marquee>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#1b3a32] py-14 text-white md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <ScrollReveal>
            <Eyebrow className="text-white/50">How it works</Eyebrow>
            <h2 className="mt-2 font-display text-3xl font-medium">What actually happens after you sign up</h2>
          </ScrollReveal>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <ScrollReveal key={step.title} delay={i * 0.08}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-medium">{step.title}</h3>
                <p className="mt-1.5 text-sm text-white/70">{step.body}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Tracks */}
      <section id="tracks" className="border-t border-border bg-[var(--accent-soft)] py-14 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <ScrollReveal>
            <Eyebrow>Live tracks</Eyebrow>
            <h2 className="mt-2 font-display text-3xl font-medium">What you can learn right now</h2>
            <p className="mt-2 max-w-2xl text-muted">
              Every track below is live today — pick one and you&apos;re placed, not dumped at lesson one.
              Tap a card to see where it takes you.
            </p>
          </ScrollReveal>

          {isLoading ? (
            <Loader />
          ) : (
            <div className="mt-10 flex flex-col gap-10">
              {tracksByCategory.map((group, groupIndex) => {
                const isLastGroup = groupIndex === tracksByCategory.length - 1;
                return (
                  <div key={group.category}>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-2">{TRACK_CATEGORY_LABELS[group.category]}</p>
                    <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {group.tracks.map((track, i) => (
                        <ScrollReveal key={track.id} delay={(i % 3) * 0.08}>
                          <ExpandableTrackCard
                            track={track}
                            isExpanded={expandedTrackId === track.id}
                            onHover={() => setExpandedTrackId(track.id)}
                            onToggle={() => setExpandedTrackId((prev) => (prev === track.id ? null : track.id))}
                          />
                        </ScrollReveal>
                      ))}
                      {isLastGroup && (
                        <ScrollReveal delay={(group.tracks.length % 3) * 0.08}>
                          <FinanceComingSoonCard />
                        </ScrollReveal>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <ProofSection lesson={lessonPreview} />

      {/* Pricing */}
      <section className="py-14 md:py-24">
        <div className="mx-auto max-w-4xl px-4">
          <ScrollReveal>
            <Eyebrow className="text-center">Pricing</Eyebrow>
            <h2 className="mt-2 text-center font-display text-3xl font-medium">Simple pricing</h2>
            <p className="mt-2 text-center text-muted">Start free. Upgrade when the daily limits get in your way.</p>
          </ScrollReveal>
          <ScrollReveal delay={0.1} className="mt-10">
            <PricingTable />
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs font-medium uppercase tracking-wide text-muted-2 ${className ?? ""}`}>{children}</p>;
}

function StatsBand({ trackCount }: { trackCount: number }) {
  const stats = [
    { value: `${trackCount}`, label: "Live tracks · Finance & Trading coming soon", icon: Layers },
    { value: `${MASTERY_PHASES.length}`, label: "Levels per track: beginner to mastery", icon: BarChart3 },
    { value: "24/7", label: "AI tutor — never off the clock", icon: Clock3 },
    { value: "5/day", label: "Free tutor messages", icon: MessageSquare },
  ];
  return (
    <section className="text-white" style={{ background: "linear-gradient(135deg, #1b3a32, #0f2018)" }}>
      <ScrollReveal className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-12 sm:grid-cols-4 sm:divide-x sm:divide-white/10 md:py-16">
        {stats.map((s) => (
          <AnimatedStat key={s.label} {...s} />
        ))}
      </ScrollReveal>
    </section>
  );
}

function AnimatedStat({ value, label, icon: Icon }: { value: string; label: string; icon: LucideIcon }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const match = value.match(/^(\d+)(.*)$/);
  const target = match ? parseInt(match[1], 10) : null;
  const suffix = match ? match[2] : "";
  const [display, setDisplay] = useState(reduced || target === null ? value : `0${suffix}`);

  useEffect(() => {
    if (reduced || target === null) {
      setDisplay(value);
      return;
    }
    if (!inView) return;

    const duration = 900;
    const start = performance.now();
    let raf: number;

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(`${Math.round(progress * (target ?? 0))}${suffix}`);
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, suffix, reduced, value]);

  return (
    <div className="flex flex-col items-center gap-1.5 text-center sm:items-start sm:px-6 sm:text-left sm:first:pl-0">
      <Icon className="h-4 w-4 text-white/45" />
      <p ref={ref} className="font-display text-2xl font-medium tabular-nums sm:text-3xl">
        {display}
      </p>
      <p className="text-xs text-white/60 sm:text-sm">{label}</p>
    </div>
  );
}

function FinanceComingSoonCard() {
  const joinWaitlist = useJoinWaitlist();
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await joinWaitlist.mutateAsync({ email, source: "finance-track" });
  }

  return (
    <Card className="flex h-full flex-col items-start justify-center gap-2 border-dashed text-muted">
      <span className="rounded-full bg-surface-raised px-2.5 py-0.5 text-xs font-medium">Coming soon</span>
      <h3 className="font-medium text-foreground">Finance & Trading</h3>
      <p className="text-sm">Forex, stock trading, personal finance, and crypto/DeFi tracks — same AI-tutor model, on the way.</p>

      {joinWaitlist.isSuccess ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-success">
          <Check className="h-4 w-4" /> {joinWaitlist.data?.message}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-2 flex w-full gap-1.5">
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-2" />
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 w-full rounded-lg border border-border-strong bg-background pl-8 pr-2 text-xs outline-none focus:border-[var(--accent)]"
            />
          </div>
          <button
            type="submit"
            disabled={joinWaitlist.isPending}
            className="whitespace-nowrap rounded-lg bg-[var(--accent)] px-3 text-xs font-medium text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            Get notified
          </button>
        </form>
      )}
    </Card>
  );
}
