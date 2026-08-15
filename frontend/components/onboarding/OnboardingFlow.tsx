"use client";

import { useEffect, useState } from "react";
import { Code2, Banknote, Check } from "lucide-react";
import type { ConfidenceLevel, SelfAssessmentLevel, TrackCourse } from "@ai-learning-platform/shared";
import { useTracks } from "@/lib/queries/tracks";
import { usePlacementQuestion, useSkills, useCompleteOnboarding } from "@/lib/queries/courses";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Loader } from "@/components/Loader";

const FINANCE_PREVIEW_TRACKS = ["Forex Trading", "Stock Trading", "Personal Finance", "Crypto & DeFi"];

const LEVELS: { value: SelfAssessmentLevel; label: string; blurb: string }[] = [
  { value: "complete_beginner", label: "Complete beginner", blurb: "I'm brand new to this." },
  { value: "some_exposure", label: "Some exposure", blurb: "I've dabbled a little." },
  { value: "intermediate", label: "Intermediate", blurb: "I'm comfortable with the basics." },
  { value: "advanced", label: "Advanced", blurb: "I want to sharpen advanced skills." },
];

const CONFIDENCE_LEVELS: { value: ConfidenceLevel; label: string }[] = [
  { value: "never_heard", label: "Never heard of it" },
  { value: "seen_it", label: "Seen it" },
  { value: "used_it", label: "Used it" },
  { value: "confident", label: "Confident" },
];

type Step = 2 | 3 | 4;

export function OnboardingFlow({
  onComplete,
  initialTrackSlug,
  initialLevel,
}: {
  onComplete: (courseId: string) => void;
  /** From the landing page's placement teaser deep-link (?track=&level=) — pre-fills but never skips a step. */
  initialTrackSlug?: string;
  initialLevel?: SelfAssessmentLevel;
}) {
  const [step, setStep] = useState<Step>(2);
  const [subject, setSubject] = useState<"programming" | "finance">("programming");
  const [course, setCourse] = useState<TrackCourse | null>(null);
  const [selfAssessedLevel, setSelfAssessedLevel] = useState<SelfAssessmentLevel | null>(initialLevel ?? null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [confidenceRatings, setConfidenceRatings] = useState<Record<string, ConfidenceLevel>>({});

  const { data: tracks, isLoading: tracksLoading } = useTracks();

  useEffect(() => {
    if (!initialTrackSlug || course) return;
    const match = tracks?.tracks.flatMap((t) => t.courses).find((c) => c.slug === initialTrackSlug);
    if (match) setCourse(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks, initialTrackSlug]);
  const { data: placementQuestion, isLoading: placementLoading } = usePlacementQuestion(
    course?.id,
    selfAssessedLevel ?? undefined
  );
  const { data: skillsData, isLoading: skillsLoading } = useSkills(course?.id);
  const completeOnboarding = useCompleteOnboarding();

  const courses = tracks?.tracks.flatMap((t) => t.courses) ?? [];

  async function handleFinish() {
    if (!course || !selfAssessedLevel || !answer || !placementQuestion) return;
    const enrollment = await completeOnboarding.mutateAsync({
      courseId: course.id,
      selfAssessedLevel,
      questionId: placementQuestion.id,
      answer,
      confidenceRatings: Object.entries(confidenceRatings).map(([skillId, level]) => ({ skillId, level })),
    });
    onComplete(enrollment.courseId);
  }

  if (step === 2) {
    return (
      <AuthShell step={{ current: 2, total: 4 }}>
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-2xl font-medium">Choose your subject</h1>
          <div className="grid grid-cols-2 gap-3">
            <SubjectCard
              icon={Banknote}
              title="Finance & Trading"
              blurb="Forex, stocks, crypto, options"
              selected={subject === "finance"}
              onClick={() => setSubject("finance")}
            />
            <SubjectCard
              icon={Code2}
              title="Programming & AI"
              blurb="Python, web dev, AI engineering"
              selected={subject === "programming"}
              onClick={() => setSubject("programming")}
            />
          </div>

          {subject === "finance" ? (
            <div className="flex flex-col gap-2">
              {FINANCE_PREVIEW_TRACKS.map((t) => (
                <div
                  key={t}
                  className="flex items-center justify-between rounded-lg border border-dashed border-border-strong px-4 py-3 text-sm text-muted-2"
                >
                  {t}
                  <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                    Coming soon
                  </span>
                </div>
              ))}
            </div>
          ) : tracksLoading ? (
            <Loader />
          ) : (
            <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
              {courses.map((c) => {
                const selected = course?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCourse(c)}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                      selected ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-border-strong hover:border-[var(--accent)]"
                    }`}
                  >
                    <div>
                      <p className="font-medium">{c.title}</p>
                      {c.description ? <p className="mt-0.5 text-xs text-muted">{c.description}</p> : null}
                    </div>
                    {selected ? <Check className="h-4 w-4 shrink-0 text-[var(--accent)]" /> : null}
                  </button>
                );
              })}
            </div>
          )}

          <Button disabled={subject !== "programming" || !course} onClick={() => setStep(3)}>
            Choose this track
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (step === 3) {
    return (
      <AuthShell step={{ current: 3, total: 4 }}>
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-2xl font-medium">Set your level</h1>
          <div className="grid gap-2">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                onClick={() => {
                  setSelfAssessedLevel(l.value);
                  setAnswer(null);
                }}
                className={`flex flex-col rounded-lg border px-4 py-2.5 text-left transition-colors ${
                  selfAssessedLevel === l.value
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-border-strong hover:border-[var(--accent)]"
                }`}
              >
                <span className="text-sm font-medium">{l.label}</span>
                <span className="text-xs text-muted">{l.blurb}</span>
              </button>
            ))}
          </div>

          {selfAssessedLevel ? (
            placementLoading || !placementQuestion ? (
              <Loader />
            ) : (
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
                <p className="text-sm font-medium">{placementQuestion.question}</p>
                {placementQuestion.codeSnippet ? (
                  <pre className="overflow-x-auto rounded-lg border border-border bg-surface-raised p-3 text-xs">
                    <code>{placementQuestion.codeSnippet}</code>
                  </pre>
                ) : null}
                <div className="grid gap-2">
                  {(Object.entries(placementQuestion.options) as [string, string][]).map(([key, text]) => (
                    <button
                      key={key}
                      onClick={() => setAnswer(key)}
                      className={`rounded-lg border px-3 py-2 text-left text-sm ${
                        answer === key
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                          : "border-border-strong hover:border-[var(--accent)]"
                      }`}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            )
          ) : null}

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button disabled={!answer} onClick={() => setStep(4)}>
              Continue
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell step={{ current: 4, total: 4 }}>
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-2xl font-medium">Rate your confidence</h1>
        {skillsLoading ? (
          <Loader />
        ) : (
          <div className="flex max-h-80 flex-col gap-4 overflow-y-auto">
            {skillsData?.skills.map((skill) => (
              <div key={skill.id}>
                <p className="mb-2 text-sm font-medium">{skill.name}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {CONFIDENCE_LEVELS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setConfidenceRatings((prev) => ({ ...prev, [skill.id]: c.value }))}
                      className={`rounded-lg border px-2 py-2 text-xs ${
                        confidenceRatings[skill.id] === c.value
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                          : "border-border-strong hover:border-[var(--accent)]"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {!skillsData?.skills.length ? <p className="text-sm text-muted">No skills to rate for this course.</p> : null}
          </div>
        )}
        <div className="flex justify-between">
          <Button variant="ghost" onClick={() => setStep(3)}>
            Back
          </Button>
          <Button isLoading={completeOnboarding.isPending} onClick={handleFinish}>
            Start course
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}

function SubjectCard({
  icon: Icon,
  title,
  blurb,
  selected,
  onClick,
}: {
  icon: typeof Code2;
  title: string;
  blurb: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors ${
        selected ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-border-strong hover:border-[var(--accent)]"
      }`}
    >
      {selected ? (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)]">
          <Check className="h-3 w-3 text-[var(--accent-foreground)]" />
        </span>
      ) : null}
      <Icon className="h-5 w-5 text-[var(--accent)]" />
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs text-muted">{blurb}</span>
    </button>
  );
}
