"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import type { QuizAttemptResponse, GradedQuizType } from "@ai-learning-platform/shared";
import { useStartQuizAttempt, useSubmitQuizAttempt, CooldownActiveError } from "@/lib/queries/quizzes";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Loader } from "@/components/Loader";

function QuizInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get("courseId") ?? "";
  const moduleId = searchParams.get("moduleId") ?? undefined;
  const type = (searchParams.get("type") as GradedQuizType | null) ?? "module_quiz";

  const startAttempt = useStartQuizAttempt();
  const submitAttempt = useSubmitQuizAttempt();
  const [attempt, setAttempt] = useState<QuizAttemptResponse | null>(null);
  const [result, setResult] = useState<QuizAttemptResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    startAttempt.mutate(
      { courseId, moduleId, type },
      {
        onSuccess: (res) => setAttempt(res),
        onError: (err) => {
          setStartError(
            err instanceof CooldownActiveError
              ? `This quiz is on cool-down until ${new Date(err.retryAvailableAt).toLocaleString()}.`
              : "Couldn't start the quiz. Please try again."
          );
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, moduleId, type]);

  if (!courseId) return <p className="text-danger">Missing course context for this quiz.</p>;
  if (startError) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <p className="text-danger">{startError}</p>
        <Link href={`/courses/${courseId}`} className="mt-4 inline-block text-sm text-[var(--accent)]">
          Back to course
        </Link>
      </Card>
    );
  }
  if (!attempt) return <Loader />;

  if (result) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="flex flex-col items-center gap-2 text-center">
          {result.passed ? (
            <CheckCircle2 className="h-10 w-10 text-success" />
          ) : (
            <XCircle className="h-10 w-10 text-danger" />
          )}
          <h1 className="font-display text-3xl font-medium">{result.passed ? "Passed!" : "Not quite"}</h1>
          <p className="text-muted">Score: {result.score}%</p>
          {!result.passed && result.retryAvailableAt ? (
            <p className="text-sm text-muted">
              You can retry after {new Date(result.retryAvailableAt).toLocaleString()}.
            </p>
          ) : null}
        </Card>

        <div className="mt-6 flex flex-col gap-4">
          {result.questions.map((q, i) => {
            const fb = result.feedback?.find((f) => f.questionId === q.id);
            return (
              <Card key={q.id}>
                <p className="font-medium">
                  {i + 1}. {q.prompt}
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm">
                  {fb?.correct ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-danger" />
                  )}
                  Your answer: {result.answers?.find((a) => a.questionId === q.id)?.answer ?? "—"}
                </p>
                {!fb?.correct ? <p className="mt-1 text-sm text-muted">Correct answer: {fb?.correctAnswer}</p> : null}
                {fb?.feedback ? <p className="mt-1 text-sm text-muted">{fb.feedback}</p> : null}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={() => router.push(`/courses/${courseId}`)}>Back to course</Button>
        </div>
      </div>
    );
  }

  const allAnswered = attempt.questions.every((q) => answers[q.id]?.trim());

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-medium">Module quiz</h1>
      <p className="mt-1 text-sm text-muted">{attempt.questions.length} questions — no timer.</p>

      <div className="mt-6 flex flex-col gap-5">
        {attempt.questions.map((q, i) => (
          <Card key={q.id}>
            <p className="font-medium">
              {i + 1}. {q.prompt}
            </p>
            {q.type === "mcq" ? (
              <div className="mt-3 grid gap-2">
                {q.options?.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                    className={`rounded-lg border px-3 py-2 text-left text-sm ${
                      answers[q.id] === opt
                        ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                        : "border-border-strong hover:border-[var(--accent)]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                rows={4}
                className="mt-3 w-full rounded-lg border border-border-strong bg-surface p-3 text-sm outline-none focus:border-[var(--accent)]"
                placeholder="Your answer…"
              />
            )}
          </Card>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          disabled={!allAnswered}
          isLoading={submitAttempt.isPending}
          onClick={async () => {
            const res = await submitAttempt.mutateAsync({
              attemptId: attempt.id,
              answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
            });
            setResult(res);
          }}
        >
          Submit quiz
        </Button>
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<Loader />}>
      <QuizInner />
    </Suspense>
  );
}
