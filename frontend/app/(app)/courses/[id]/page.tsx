"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, CheckCircle2, Circle, Clock, ClipboardCheck, Lock, Sparkles } from "lucide-react";
import type { ModuleResponse, PhaseLevel } from "@ai-learning-platform/shared";
import { useCourse, useMyCourses } from "@/lib/queries/courses";
import { useCourseProgress, useModuleStatus } from "@/lib/queries/progress";
import { useStartQuizAttempt, useRecordKnowledgeCheckCompletion, CooldownActiveError } from "@/lib/queries/quizzes";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Loader } from "@/components/Loader";
import { KnowledgeCheck } from "@/components/KnowledgeCheck";

const PHASE_ORDER: PhaseLevel[] = ["foundation", "intermediate", "advanced", "mastery"];
const PHASE_LABELS: Record<PhaseLevel, string> = {
  foundation: "Foundation",
  intermediate: "Intermediate",
  advanced: "Advanced",
  mastery: "Mastery",
};

/** True if every module key concept matches something the learner already rated confident/used_it on. */
function likelyKnowsModule(mod: ModuleResponse, priorExperienceSkillNames: string[]): boolean {
  if (mod.keyConcepts.length === 0 || priorExperienceSkillNames.length === 0) return false;
  return mod.keyConcepts.every((concept) =>
    priorExperienceSkillNames.some(
      (skill) => concept.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(concept.toLowerCase())
    )
  );
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: course, isLoading } = useCourse(id);
  const { data: progress } = useCourseProgress(id);
  const { data: moduleStatuses } = useModuleStatus(id);
  const { data: myCourses } = useMyCourses();
  const startAttempt = useStartQuizAttempt();
  const recordCompletion = useRecordKnowledgeCheckCompletion();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [skipChallengeModuleId, setSkipChallengeModuleId] = useState<string | null>(null);
  const [skippedModuleIds, setSkippedModuleIds] = useState<Set<string>>(new Set());

  const priorExperienceSkillNames = myCourses?.courses.find((c) => c.courseId === id)?.priorExperienceSkillNames ?? [];

  async function handlePassedSkipChallenge(mod: ModuleResponse) {
    setSkippedModuleIds((prev) => new Set(prev).add(mod.id));
    setSkipChallengeModuleId(null);
    // Passing the skip-ahead challenge counts as passing every lesson's knowledge check in this
    // module — the same signal a normal lesson-by-lesson pass would record.
    await Promise.all(
      mod.lessons.map((lesson) => recordCompletion.mutateAsync({ courseId: id, moduleId: mod.id, lessonId: lesson.id }))
    );
  }

  async function handleStartModuleQuiz(moduleId: string) {
    setQuizError(null);
    try {
      const attempt = await startAttempt.mutateAsync({ courseId: id, moduleId, type: "module_quiz" });
      router.push(`/quizzes/${attempt.id}?courseId=${id}&moduleId=${moduleId}&type=module_quiz`);
    } catch (err) {
      if (err instanceof CooldownActiveError) {
        setQuizError(`On cool-down until ${new Date(err.retryAvailableAt).toLocaleString()}.`);
      } else {
        setQuizError("Couldn't start the quiz. Please try again.");
      }
    }
  }

  if (isLoading || !course) return <Loader />;

  return (
    <div className="mx-auto max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-medium">{course.title}</h1>
        {course.description ? <p className="mt-2 text-muted">{course.description}</p> : null}
      </div>

      {progress ? (
        <Card className="mt-6 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Course progress</span>
              <span className="font-medium">{progress.completionPercent}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-surface-raised">
              <div
                className="h-2 rounded-full bg-[var(--accent)] transition-all"
                style={{ width: `${progress.completionPercent}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap text-sm text-muted">
            <Clock className="h-4 w-4" />
            {progress.estimatedMinutesRemaining}m left
          </div>
        </Card>
      ) : null}

      {quizError ? <p className="mt-4 text-sm text-danger">{quizError}</p> : null}

      <div className="mt-6 flex flex-col gap-6">
        {PHASE_ORDER.map((phase) => {
          const modulesInPhase = course.modules.filter((m) => m.phase === phase).sort((a, b) => a.orderIndex - b.orderIndex);
          if (modulesInPhase.length === 0) return null;
          return (
            <div key={phase}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-2">{PHASE_LABELS[phase]}</p>
              <div className="flex flex-col gap-3">
                {modulesInPhase.map((mod) => {
                  const status = moduleStatuses?.find((s) => s.moduleId === mod.id);
                  const locked = status?.locked ?? false;
                  const lessonStatusById = new Map((status?.lessons ?? []).map((l) => [l.id, l]));
                  const isOpen = expanded === mod.id && !locked;
                  const likelyKnown = likelyKnowsModule(mod, priorExperienceSkillNames) && !skippedModuleIds.has(mod.id);
                  const showingSkipChallenge = skipChallengeModuleId === mod.id;
                  return (
                    <Card key={mod.id} className={`p-0 ${locked ? "opacity-50" : ""}`}>
                      <button
                        onClick={() => !locked && setExpanded(isOpen ? null : mod.id)}
                        disabled={locked}
                        className="flex w-full items-center justify-between px-5 py-4 text-left disabled:cursor-not-allowed"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{mod.title}</p>
                            {likelyKnown ? (
                              <span className="flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--accent)]">
                                <Sparkles className="h-3 w-3" /> You likely know this
                              </span>
                            ) : null}
                          </div>
                          {mod.description ? <p className="mt-0.5 text-sm text-muted">{mod.description}</p> : null}
                        </div>
                        {locked ? (
                          <Lock className="h-4 w-4 shrink-0 text-muted-2" />
                        ) : (
                          <ChevronDown className={`h-4 w-4 shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        )}
                      </button>

                      {isOpen ? (
                        <div className="border-t border-border px-5 py-4">
                          {likelyKnown ? (
                            <div className="mb-4 rounded-lg border border-dashed border-border-strong p-4">
                              {showingSkipChallenge ? (
                                <KnowledgeCheck
                                  courseId={id}
                                  moduleId={mod.id}
                                  lessonId={mod.lessons[0]?.id ?? ""}
                                  onPassed={() => handlePassedSkipChallenge(mod)}
                                />
                              ) : (
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm text-muted">
                                    Your onboarding ratings suggest you already know this — skim the lessons below, or
                                    take a quick challenge to skip ahead.
                                  </p>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="shrink-0"
                                    disabled={mod.lessons.length === 0}
                                    onClick={() => setSkipChallengeModuleId(mod.id)}
                                  >
                                    Take challenge
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : null}
                          <ul className="flex flex-col gap-1">
                            {mod.lessons.map((lesson) => {
                              const lessonStatus = lessonStatusById.get(lesson.id);
                              const done = lessonStatus?.completed ?? false;
                              const lessonLocked = lessonStatus?.locked ?? false;
                              return (
                                <li key={lesson.id}>
                                  {lessonLocked ? (
                                    <div className="flex cursor-not-allowed items-center gap-2 rounded-lg px-2 py-2 text-sm opacity-50">
                                      <Lock className="h-4 w-4 shrink-0 text-muted-2" />
                                      <span>{lesson.title}</span>
                                    </div>
                                  ) : (
                                    <Link
                                      href={`/courses/${id}/lessons/${lesson.id}`}
                                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-surface-hover"
                                    >
                                      {done ? (
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                                      ) : (
                                        <Circle className="h-4 w-4 shrink-0 text-muted-2" />
                                      )}
                                      <span className={done ? "text-muted" : ""}>{lesson.title}</span>
                                    </Link>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="mt-3"
                            disabled={locked}
                            isLoading={startAttempt.isPending}
                            onClick={() => handleStartModuleQuiz(mod.id)}
                          >
                            <ClipboardCheck className="h-4 w-4" />
                            Take module quiz
                          </Button>
                        </div>
                      ) : null}
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
