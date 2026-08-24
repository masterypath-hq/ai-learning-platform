"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, Award, ArrowRight, BookOpen, CheckCircle2, CircleDot, Circle, Lock, Sparkles, Clock3, Rocket } from "lucide-react";
import type { BadgeId, ModuleStatusResponse, PhaseLevel, ProgressRecord } from "@ai-learning-platform/shared";
import { findTrack } from "@ai-learning-platform/shared";
import { useRouter } from "next/navigation";
import { useDashboard, useCourseProgress, useModuleStatus } from "@/lib/queries/progress";
import { useEnrollInCourse } from "@/lib/queries/courses";
import { useTracks } from "@/lib/queries/tracks";
import { useAuthStore } from "@/lib/auth-store";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Loader } from "@/components/Loader";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useCountUp } from "@/lib/useCountUp";

const BADGE_LABELS: Record<BadgeId, string> = {
  first_lesson: "First Lesson",
  seven_day_streak: "7-Day Streak",
  first_course_completed: "First Course Completed",
  first_quiz_passed: "First Quiz Passed",
};

const ACTIVITY_LABELS: Record<ProgressRecord["activityType"], string> = {
  lesson_viewed: "Viewed a lesson",
  knowledge_check_completed: "Completed a knowledge check",
  module_completed: "Passed a module quiz",
  course_completed: "Completed a course",
  chat_session_closed: "Wrapped up an AI tutor session",
};

type ModuleStatus = "done" | "in_progress" | "not_started" | "locked";

const PHASE_ORDER: PhaseLevel[] = ["foundation", "intermediate", "advanced", "mastery"];
const PHASE_LABELS: Record<PhaseLevel, string> = {
  foundation: "Foundation",
  intermediate: "Intermediate",
  advanced: "Advanced",
  mastery: "Mastery",
};

function moduleStatus(mod: ModuleStatusResponse): ModuleStatus {
  if (mod.locked) return "locked";
  if (mod.completed) return "done";
  if (mod.lessons.some((l) => l.completed)) return "in_progress";
  return "not_started";
}

export default function DashboardPage() {
  const name = useAuthStore((s) => s.name);
  const { data, isLoading } = useDashboard();
  const nextAction = data?.recommendedNextAction ?? null;

  const activeCourseId = (nextAction?.type === "continue" ? nextAction.courseId : undefined) ?? data?.courses[0]?.courseId;
  const { data: activeCourseProgress } = useCourseProgress(activeCourseId);
  const { data: moduleStatuses } = useModuleStatus(activeCourseId);

  if (isLoading || !data) return <Loader />;

  const firstName = name?.split(" ")[0];
  const avgScore = data.recentQuizScores.length
    ? Math.round(data.recentQuizScores.reduce((s, r) => s + r.score, 0) / data.recentQuizScores.length)
    : null;
  const activeSummary = data.courses.find((c) => c.courseId === activeCourseId);
  const otherCourses = data.courses.filter((c) => c.courseId !== activeCourseId);

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl p-8 text-white"
        style={{ background: "linear-gradient(135deg, #24493f, #0f2a22)" }}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl"
          animate={{ x: [0, 20, 0], y: [0, 10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide">
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered tutoring path
            </span>
            <h1 className="mt-4 font-display text-3xl font-medium leading-tight">
              {firstName ? `Keep going, ${firstName}.` : "Keep going."}
            </h1>
            <p className="mt-1 text-sm text-white/70">You&apos;re building something real.</p>
            {nextAction?.type === "continue" ? (
              <Link
                href={`/courses/${nextAction.courseId}/lessons/${nextAction.lessonId}`}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-[#0f2a22] transition-transform hover:scale-[1.02]"
              >
                Continue learning <ArrowRight className="h-4 w-4" />
              </Link>
            ) : nextAction?.type === "accelerator" ? (
              <AcceleratorCta targetTrackSlug={nextAction.targetTrackSlug} label={nextAction.label} />
            ) : (
              <Link
                href="/register?step=onboarding"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-[#0f2a22] transition-transform hover:scale-[1.02]"
              >
                Start a track <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          <div className="flex gap-3">
            <StatPill icon={Flame} label="Learning streak" value={data.streak.currentStreak} suffix=" days" />
            <StatPill icon={Award} label="Longest streak" value={data.streak.longestStreak} suffix=" days" />
            <StatPill icon={Clock3} label="Avg. quiz score" value={avgScore ?? 0} suffix="%" muted={avgScore === null} />
          </div>
        </div>
      </motion.div>

      {/* Active track */}
      {activeSummary ? (
        <ScrollReveal>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-2">Active track</p>
                <p className="mt-1 font-display text-lg font-medium">{activeSummary.title}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-2">Overall progress</p>
                <p className="font-medium">
                  {activeSummary.completionPercent}%
                  {activeCourseProgress ? (
                    <span className="ml-2 text-xs font-normal text-muted">
                      {activeCourseProgress.completedLessons.length} of{" "}
                      {activeCourseProgress.completedLessons.length + activeCourseProgress.remainingLessons.length}{" "}
                      lessons
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-surface-raised">
              <div
                className="h-2 rounded-full bg-[var(--accent)] transition-all duration-700"
                style={{ width: `${activeSummary.completionPercent}%` }}
              />
            </div>

            <p className="mb-3 mt-6 text-sm font-medium text-muted">Modules in {activeSummary.title}</p>
            <div className="flex flex-col gap-5">
              {PHASE_ORDER.map((phase) => {
                const modulesInPhase = (moduleStatuses ?? [])
                  .filter((m) => m.phase === phase)
                  .sort((a, b) => a.orderIndex - b.orderIndex);
                if (modulesInPhase.length === 0) return null;
                return (
                  <div key={phase}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-2">{PHASE_LABELS[phase]}</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {modulesInPhase.map((mod, i) => {
                        const status = moduleStatus(mod);
                        const nextLesson = mod.lessons.find((l) => !l.completed);
                        const href = mod.locked
                          ? null
                          : nextLesson
                            ? `/courses/${activeCourseId}/lessons/${nextLesson.id}`
                            : `/courses/${activeCourseId}`;
                        const cardContent = (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-2">{mod.lessons.length} lessons</span>
                              <StatusChip status={status} />
                            </div>
                            <p className="text-sm font-medium">{mod.title}</p>
                            {status === "in_progress" ? (
                              <span className="mt-auto flex items-center gap-1 text-xs font-medium text-[var(--accent)]">
                                Continue <ArrowRight className="h-3 w-3" />
                              </span>
                            ) : null}
                          </>
                        );
                        return (
                          <motion.div
                            key={mod.moduleId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05, duration: 0.4 }}
                          >
                            {href ? (
                              <Link
                                href={href}
                                className={`flex h-full flex-col gap-2 rounded-xl border p-4 transition-colors ${
                                  status === "in_progress"
                                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                                    : "border-border bg-surface hover:border-[var(--accent)]"
                                }`}
                              >
                                {cardContent}
                              </Link>
                            ) : (
                              <div className="flex h-full cursor-not-allowed flex-col gap-2 rounded-xl border border-border bg-surface p-4 opacity-50">
                                {cardContent}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </ScrollReveal>
      ) : null}

      {!activeSummary ? (
        <Card>
          <p className="text-sm text-muted">You haven&apos;t enrolled in a course yet.</p>
          <Link href="/register?step=onboarding" className="mt-2 inline-block text-sm text-[var(--accent)]">
            Browse tracks →
          </Link>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent activity */}
        <ScrollReveal>
          <Card>
            <p className="text-xs uppercase tracking-wide text-muted-2">Recent activity</p>
            {data.recentActivity.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Nothing yet — go view a lesson.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {data.recentActivity.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                    <div>
                      <p>
                        {ACTIVITY_LABELS[item.activityType]}
                        {item.courseId ? (
                          <span className="text-muted"> · {data.courses.find((c) => c.courseId === item.courseId)?.title}</span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-2">{new Date(item.occurredAt).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </ScrollReveal>

        {/* Badges */}
        <ScrollReveal delay={0.08}>
          <Card>
            <p className="text-xs uppercase tracking-wide text-muted-2">Badges</p>
            {data.badges.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Complete a lesson to earn your first badge.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {data.badges.map((b) => (
                  <Badge key={b} tone="accent">
                    <Award className="h-3 w-3" /> {BADGE_LABELS[b]}
                  </Badge>
                ))}
              </div>
            )}

            {data.recentQuizScores.length > 0 ? (
              <>
                <p className="mb-2 mt-6 text-xs uppercase tracking-wide text-muted-2">Recent quiz scores</p>
                <div className="flex flex-col gap-2">
                  {data.recentQuizScores.slice(0, 3).map((s) => (
                    <div key={s.attemptId} className="flex items-center justify-between rounded-lg bg-surface-raised px-3 py-2 text-sm">
                      <span className="text-muted">{new Date(s.submittedAt).toLocaleDateString()}</span>
                      <span className="font-medium">{s.score}%</span>
                      <Badge tone={s.passed ? "success" : "danger"}>{s.passed ? "Passed" : "Failed"}</Badge>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </Card>
        </ScrollReveal>
      </div>

      {/* Other courses */}
      {otherCourses.length > 0 ? (
        <ScrollReveal>
          <p className="mb-3 text-sm font-medium text-muted">Other courses</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {otherCourses.map((c) => (
              <Link key={c.courseId} href={`/courses/${c.courseId}`}>
                <Card className="flex flex-col gap-2 transition-colors hover:border-[var(--accent)]">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[var(--accent)]" />
                    <p className="font-medium">{c.title}</p>
                  </div>
                  <div className="h-2 rounded-full bg-surface-raised">
                    <div className="h-2 rounded-full bg-[var(--accent)]" style={{ width: `${c.completionPercent}%` }} />
                  </div>
                  <p className="text-xs text-muted">{c.completionPercent}% complete</p>
                </Card>
              </Link>
            ))}
          </div>
        </ScrollReveal>
      ) : null}
    </div>
  );
}

function AcceleratorCta({ targetTrackSlug, label }: { targetTrackSlug: string; label: string }) {
  const router = useRouter();
  const { data: tracks } = useTracks();
  const enrollInCourse = useEnrollInCourse();

  const targetCourse = tracks?.tracks.flatMap((t) => t.courses).find((c) => c.slug === targetTrackSlug);
  const trackName = findTrack(targetTrackSlug)?.name ?? targetTrackSlug;

  async function handleClick() {
    if (!targetCourse) return;
    await enrollInCourse.mutateAsync({ courseId: targetCourse.id });
    // No chat session is pre-warmed here — sessions are always created from a specific lesson now,
    // and the learner lands on the course page to pick their first one.
    router.push(`/courses/${targetCourse.id}`);
  }

  const isPending = enrollInCourse.isPending;

  return (
    <button
      onClick={handleClick}
      disabled={!targetCourse || isPending}
      className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-[#0f2a22] transition-transform hover:scale-[1.02] disabled:opacity-60"
    >
      <Rocket className="h-4 w-4" />
      {isPending ? "Setting up…" : `${label}: ${trackName}`}
    </button>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  suffix = "",
  muted = false,
}: {
  icon: typeof Flame;
  label: string;
  value: number;
  suffix?: string;
  muted?: boolean;
}) {
  const animated = useCountUp(value);
  return (
    <div className="flex min-w-[7rem] flex-col gap-1 rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
      <Icon className="h-4 w-4 text-white/70" />
      <p className="text-lg font-semibold">{muted ? "—" : `${animated}${suffix}`}</p>
      <p className="text-[11px] uppercase tracking-wide text-white/60">{label}</p>
    </div>
  );
}

function StatusChip({ status }: { status: ModuleStatus }) {
  if (status === "done") {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-success">
        <CheckCircle2 className="h-3.5 w-3.5" /> Done
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-[var(--accent)]">
        <CircleDot className="h-3.5 w-3.5" /> In progress
      </span>
    );
  }
  if (status === "locked") {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-2">
        <Lock className="h-3.5 w-3.5" /> Locked
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-muted-2">
      <Circle className="h-3.5 w-3.5" /> Not started
    </span>
  );
}
