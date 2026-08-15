"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, CheckCircle2, Circle, Clock, ClipboardCheck } from "lucide-react";
import { useCourse } from "@/lib/queries/courses";
import { useCourseProgress } from "@/lib/queries/progress";
import { useStartQuizAttempt, CooldownActiveError } from "@/lib/queries/quizzes";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Loader } from "@/components/Loader";

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: course, isLoading } = useCourse(id);
  const { data: progress } = useCourseProgress(id);
  const startAttempt = useStartQuizAttempt();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);

  const completedIds = new Set(progress?.completedLessons.map((l) => l.id) ?? []);

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

      <div className="mt-6 flex flex-col gap-3">
        {course.modules.map((mod) => {
          const isOpen = expanded === mod.id;
          return (
            <Card key={mod.id} className="p-0">
              <button
                onClick={() => setExpanded(isOpen ? null : mod.id)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div>
                  <p className="font-medium">{mod.title}</p>
                  {mod.description ? <p className="mt-0.5 text-sm text-muted">{mod.description}</p> : null}
                </div>
                <ChevronDown className={`h-4 w-4 shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {isOpen ? (
                <div className="border-t border-border px-5 py-4">
                  <ul className="flex flex-col gap-1">
                    {mod.lessons.map((lesson) => {
                      const done = completedIds.has(lesson.id);
                      return (
                        <li key={lesson.id}>
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
                        </li>
                      );
                    })}
                  </ul>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
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
}
