"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { QuizQuestion } from "@ai-learning-platform/shared";
import { useGenerateKnowledgeCheck, useRecordKnowledgeCheckCompletion } from "@/lib/queries/quizzes";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

/** A passing score to treat this as "known well enough to skip ahead" — not a graded threshold, just a skip signal. */
const PASS_RATIO = 2 / 3;

export function KnowledgeCheck({
  courseId,
  moduleId,
  lessonId,
  onPassed,
}: {
  courseId: string;
  moduleId: string | undefined;
  lessonId: string;
  /** Called once, after submit, if the learner scored at or above the skip-ahead pass ratio. */
  onPassed?: () => void;
}) {
  const generate = useGenerateKnowledgeCheck();
  const recordCompletion = useRecordKnowledgeCheckCompletion();
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  async function handleStart() {
    setSubmitted(false);
    setAnswers({});
    const res = await generate.mutateAsync({ lessonId, type: "knowledge_check" });
    setQuestions(res.questions);
  }

  async function handleSubmit() {
    setSubmitted(true);
    await recordCompletion.mutateAsync({ courseId, moduleId, lessonId });
    if (questions && questions.length > 0) {
      const correct = questions.filter((q) => answers[q.id] === q.correctAnswer).length;
      if (correct / questions.length >= PASS_RATIO) onPassed?.();
    }
  }

  const correctCount = questions?.filter((q) => answers[q.id] === q.correctAnswer).length ?? 0;

  if (!questions) {
    return (
      <Card className="flex flex-col items-start gap-3">
        <div>
          <h2 className="text-lg font-semibold">Knowledge check</h2>
          <p className="mt-1 text-sm text-muted">A few quick questions to check understanding — ungraded, unlimited retries.</p>
        </div>
        <Button onClick={handleStart} isLoading={generate.isPending}>
          Take knowledge check
        </Button>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Knowledge check</h2>
        {submitted ? (
          <span className="text-sm text-muted">
            {correctCount} / {questions.length} correct
          </span>
        ) : null}
      </div>

      {questions.map((q, qi) => (
        <div key={q.id}>
          <p className="font-medium">
            {qi + 1}. {q.prompt}
          </p>
          <div className="mt-2 grid gap-2">
            {q.options?.map((opt) => {
              const selected = answers[q.id] === opt;
              const isCorrectOpt = opt === q.correctAnswer;
              const showState = submitted && (selected || isCorrectOpt);
              return (
                <button
                  key={opt}
                  disabled={submitted}
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm ${
                    showState && isCorrectOpt
                      ? "border-success bg-success/10"
                      : showState && selected
                        ? "border-danger bg-danger/10"
                        : selected
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                          : "border-border-strong hover:border-[var(--accent)]"
                  }`}
                >
                  {submitted && isCorrectOpt ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> : null}
                  {submitted && selected && !isCorrectOpt ? <XCircle className="h-4 w-4 shrink-0 text-danger" /> : null}
                  {opt}
                </button>
              );
            })}
          </div>
          {submitted ? <p className="mt-2 text-sm text-muted">{q.explanation}</p> : null}
        </div>
      ))}

      {!submitted ? (
        <Button onClick={handleSubmit} disabled={Object.keys(answers).length < questions.length} isLoading={recordCompletion.isPending}>
          Check answers
        </Button>
      ) : (
        <Button variant="secondary" onClick={handleStart} isLoading={generate.isPending}>
          Try again
        </Button>
      )}
    </Card>
  );
}
