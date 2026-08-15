"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import type { QuizQuestion } from "@ai-learning-platform/shared";
import { useCourse, useMarkLessonViewed } from "@/lib/queries/courses";
import { useGenerateKnowledgeCheck, useRecordKnowledgeCheckCompletion } from "@/lib/queries/quizzes";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Loader } from "@/components/Loader";

export default function LessonPage({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const { id: courseId, lessonId } = use(params);
  const { data: course, isLoading } = useCourse(courseId);
  const markViewed = useMarkLessonViewed();

  useEffect(() => {
    markViewed.mutate({ courseId, lessonId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lessonId]);

  const { lesson, mod, nextLesson } = useMemo(() => {
    if (!course) return { lesson: null, mod: null, nextLesson: null };
    const modules = [...course.modules].sort((a, b) => a.orderIndex - b.orderIndex);
    const flat = modules.flatMap((m) => [...m.lessons].sort((a, b) => a.orderIndex - b.orderIndex).map((l) => ({ ...l, moduleId: m.id })));
    const idx = flat.findIndex((l) => l.id === lessonId);
    const currentModule = modules.find((m) => m.id === flat[idx]?.moduleId) ?? null;
    return { lesson: flat[idx] ?? null, mod: currentModule, nextLesson: idx >= 0 ? flat[idx + 1] ?? null : null };
  }, [course, lessonId]);

  if (isLoading || !course) return <Loader />;
  if (!lesson) return <p className="text-muted">Lesson not found.</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/courses/${courseId}`} className="text-sm text-muted hover:text-foreground">
        ← Back to course
      </Link>

      <h1 className="mt-3 font-display text-3xl font-medium">{lesson.title}</h1>

      {lesson.explanationContent ? (
        <div className="prose-lesson mt-6">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {lesson.explanationContent}
          </ReactMarkdown>
        </div>
      ) : null}

      {lesson.workedExamples.length > 0 ? (
        <div className="mt-8 flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Worked examples</h2>
          {lesson.workedExamples.map((we) => (
            <Card key={we.id}>
              <p className="font-medium">{we.title}</p>
              <div className="prose-lesson mt-2 text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {we.content}
                </ReactMarkdown>
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-[var(--accent)]">Show solution</summary>
                <div className="prose-lesson mt-2 text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                    {we.solution}
                  </ReactMarkdown>
                </div>
              </details>
            </Card>
          ))}
        </div>
      ) : null}

      {lesson.practiceExercise ? (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Practice exercise</h2>
          <Card className="mt-3">
            <p className="font-medium">{lesson.practiceExercise.title}</p>
            <p className="mt-2 text-sm text-muted">{lesson.practiceExercise.prompt}</p>
            {lesson.practiceExercise.hints.length > 0 ? (
              <ul className="mt-3 list-inside list-disc text-sm text-muted">
                {lesson.practiceExercise.hints.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            ) : null}
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-[var(--accent)]">Show sample solution</summary>
              <div className="prose-lesson mt-2 text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {lesson.practiceExercise.sampleSolution}
                </ReactMarkdown>
              </div>
            </details>
          </Card>
        </div>
      ) : null}

      {lesson.keyTakeaways.length > 0 ? (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Key takeaways</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {lesson.keyTakeaways.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-10">
        <KnowledgeCheck courseId={courseId} moduleId={mod?.id} lessonId={lessonId} />
      </div>

      <div className="mt-10 flex justify-end border-t border-border pt-6">
        {nextLesson ? (
          <Link
            href={`/courses/${courseId}/lessons/${nextLesson.id}`}
            className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]"
          >
            Next lesson <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            href={`/courses/${courseId}`}
            className="rounded-lg border border-border-strong px-5 py-2.5 text-sm font-medium hover:bg-surface-hover"
          >
            Back to course
          </Link>
        )}
      </div>
    </div>
  );
}

function KnowledgeCheck({ courseId, moduleId, lessonId }: { courseId: string; moduleId: string | undefined; lessonId: string }) {
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
