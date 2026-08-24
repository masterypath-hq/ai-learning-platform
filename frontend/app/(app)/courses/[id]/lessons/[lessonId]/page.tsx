"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { ArrowRight, CheckCircle2, NotebookText } from "lucide-react";
import { useCourse, useMarkLessonViewed } from "@/lib/queries/courses";
import { useChatSessions, useCreateChatSession } from "@/lib/queries/chat";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { Card } from "@/components/Card";
import { KnowledgeCheck } from "@/components/KnowledgeCheck";
import { Loader } from "@/components/Loader";

/** The AI tutor teaches the lesson conversationally — chat is the primary surface here. The
 *  generated explanation/examples/takeaways are demoted to a reference side panel rather than a
 *  page the learner reads top to bottom before ever reaching the chat. */
export default function LessonPage({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const { id: courseId, lessonId } = use(params);
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const markViewed = useMarkLessonViewed();
  const { data: sessions } = useChatSessions();
  const createSession = useCreateChatSession();
  const [notesOpen, setNotesOpen] = useState(false);

  useEffect(() => {
    markViewed.mutate({ courseId, lessonId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lessonId]);

  const session = useMemo(() => {
    if (!sessions) return null;
    return sessions.find((s) => s.lessonId === lessonId && !s.closedAt) ?? sessions.find((s) => s.lessonId === lessonId) ?? null;
  }, [sessions, lessonId]);

  useEffect(() => {
    if (sessions && !session && !createSession.isPending) {
      createSession.mutate({ lessonId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, session, lessonId]);

  const { lesson, mod, nextLesson } = useMemo(() => {
    if (!course) return { lesson: null, mod: null, nextLesson: null };
    const modules = [...course.modules].sort((a, b) => a.orderIndex - b.orderIndex);
    const flat = modules.flatMap((m) => [...m.lessons].sort((a, b) => a.orderIndex - b.orderIndex).map((l) => ({ ...l, moduleId: m.id })));
    const idx = flat.findIndex((l) => l.id === lessonId);
    const currentModule = modules.find((m) => m.id === flat[idx]?.moduleId) ?? null;
    return { lesson: flat[idx] ?? null, mod: currentModule, nextLesson: idx >= 0 ? flat[idx + 1] ?? null : null };
  }, [course, lessonId]);

  if (courseLoading || !course) return <Loader />;
  if (!lesson) return <p className="text-muted">Lesson not found.</p>;

  return (
    <div className="grid h-[calc(100vh-6rem)] grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="min-w-0">
            <Link href={`/courses/${courseId}`} className="text-xs text-muted hover:text-foreground">
              ← Back to course
            </Link>
            <p className="mt-1 truncate font-display text-base font-medium">{lesson.title}</p>
          </div>
          <button
            onClick={() => setNotesOpen((v) => !v)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface-hover lg:hidden"
          >
            <NotebookText className="h-3.5 w-3.5" /> Notes
          </button>
        </div>
        {session ? (
          <ChatPanel session={session} />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <Loader />
          </div>
        )}
      </div>

      <div className={`${notesOpen ? "flex" : "hidden"} flex-col gap-8 overflow-y-auto rounded-2xl border border-border bg-surface p-5 lg:flex`}>
        {lesson.explanationContent ? (
          <div>
            <h2 className="text-sm font-semibold text-muted">Reference notes</h2>
            <div className="prose-lesson mt-2 text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {lesson.explanationContent}
              </ReactMarkdown>
            </div>
          </div>
        ) : null}

        {lesson.workedExamples.length > 0 ? (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-muted">Worked examples</h2>
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
          <div>
            <h2 className="text-sm font-semibold text-muted">Practice exercise</h2>
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
          <div>
            <h2 className="text-sm font-semibold text-muted">Key takeaways</h2>
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

        <KnowledgeCheck courseId={courseId} moduleId={mod?.id} lessonId={lessonId} />

        <div className="flex justify-end border-t border-border pt-6">
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
    </div>
  );
}
