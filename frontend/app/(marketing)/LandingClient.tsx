"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bot, Hammer, ClipboardCheck, TrendingUp, Mail, Check } from "lucide-react";
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
    body: "Six live tracks across programming & AI engineering today, with Finance & Trading coming next.",
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

  return (
    <main>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-16 lg:grid-cols-2 lg:items-start lg:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="font-display text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl">
            Go from <em className="italic">zero</em> to job-ready, guided by an AI tutor that knows where you are.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Pick a track, get placed at your real level, and learn through live AI chat, hands-on
            lessons, and quizzes that actually check understanding — not just watch-and-forget videos.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--accent-foreground)] transition-transform hover:scale-[1.03] hover:bg-[var(--accent-hover)] active:scale-[0.98]"
            >
              Start learning free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#tracks"
              className="rounded-lg border border-border-strong px-6 py-3 text-sm font-medium transition-colors hover:bg-surface-hover"
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
      </section>

      <StatsBand trackCount={courses.length} />

      {/* Why us */}
      <section className="border-t border-border bg-surface/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <ScrollReveal>
            <h2 className="font-display text-3xl font-medium">Why learn here instead of another video course</h2>
            <p className="mt-2 max-w-2xl text-muted">
              Most platforms hand you a playlist. MasteryPath pairs one-on-one AI tutoring with the kind
              of practice and testing that makes it stick.
            </p>
          </ScrollReveal>
        </div>
        <div className="mt-10">
          <Marquee speed={38}>
            {VALUE_PROPS.map(({ icon: Icon, title, body }) => (
              <Card key={title} className="flex w-80 shrink-0 flex-col gap-3">
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
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <ScrollReveal>
            <h2 className="font-display text-3xl font-medium">What actually happens after you sign up</h2>
          </ScrollReveal>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <ScrollReveal key={step.title} delay={i * 0.08}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent)]">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-medium">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{step.body}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Tracks */}
      <section id="tracks" className="border-t border-border bg-surface/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <ScrollReveal>
            <h2 className="font-display text-3xl font-medium">What you can learn right now</h2>
            <p className="mt-2 max-w-2xl text-muted">
              Every track below is live today — pick one and you&apos;re placed, not dumped at lesson one.
              Tap a card to see where it takes you.
            </p>
          </ScrollReveal>

          {isLoading ? (
            <Loader />
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course, i) => (
                <ScrollReveal key={course.id} delay={(i % 3) * 0.08}>
                  <ExpandableTrackCard
                    course={course}
                    isExpanded={expandedTrackId === course.id}
                    onHover={() => setExpandedTrackId(course.id)}
                    onToggle={() => setExpandedTrackId((prev) => (prev === course.id ? null : course.id))}
                  />
                </ScrollReveal>
              ))}

              <ScrollReveal delay={(courses.length % 3) * 0.08}>
                <FinanceComingSoonCard />
              </ScrollReveal>
            </div>
          )}
        </div>
      </section>

      <ProofSection lesson={lessonPreview} />

      {/* Pricing */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <ScrollReveal>
            <h2 className="text-center font-display text-3xl font-medium">Simple pricing</h2>
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

function StatsBand({ trackCount }: { trackCount: number }) {
  const stats = [
    { value: `${trackCount || "6"}`, label: "Live tracks · Finance & Trading coming soon" },
    { value: `${MASTERY_PHASES.length}`, label: "Levels per track: beginner to mastery" },
    { value: "24/7", label: "AI tutor — never off the clock" },
    { value: "5/day", label: "Free tutor messages" },
  ];
  return (
    <section className="text-white" style={{ background: "linear-gradient(135deg, #1b3a32, #0f2018)" }}>
      <ScrollReveal className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="font-display text-2xl font-medium sm:text-3xl">{s.value}</p>
            <p className="mt-1 text-xs text-white/60 sm:text-sm">{s.label}</p>
          </div>
        ))}
      </ScrollReveal>
    </section>
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
