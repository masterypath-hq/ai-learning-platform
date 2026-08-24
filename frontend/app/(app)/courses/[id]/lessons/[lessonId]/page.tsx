"use client";

import { use, useEffect, useMemo } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useCourse, useMarkLessonViewed } from "@/lib/queries/courses";
import { Card } from "@/components/Card";
import { KnowledgeCheck } from "@/components/KnowledgeCheck";
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
