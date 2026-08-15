import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { LessonResponse } from "@ai-learning-platform/shared";
import { TESTIMONIALS } from "@/lib/testimonials";
import { Card } from "@/components/Card";
import { ScrollReveal } from "@/components/ScrollReveal";
import { DashboardPreviewCard } from "./DashboardPreviewCard";

export function ProofSection({ lesson }: { lesson: LessonResponse | null }) {
  return (
    <section className="border-t border-border bg-surface/40 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <ScrollReveal>
          <h2 className="font-display text-3xl font-medium">See what a lesson actually looks like</h2>
          <p className="mt-2 max-w-2xl text-muted">Real content from the Cybersecurity track — not a mockup screenshot.</p>
        </ScrollReveal>

        {lesson ? (
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <ScrollReveal>
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="flex items-center gap-1.5 border-b border-border bg-surface-raised px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                  <span className="ml-2 truncate rounded bg-background px-2 py-0.5 text-xs text-muted-2">
                    masterypath.app/lessons/{lesson.slug}
                  </span>
                </div>
                <div className="max-h-[26rem] overflow-y-auto p-5">
                  <h3 className="font-display text-lg font-medium">{lesson.title}</h3>
                  {lesson.explanationContent ? (
                    <div className="prose-lesson mt-3 text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                        {lesson.explanationContent}
                      </ReactMarkdown>
                    </div>
                  ) : null}
                  {lesson.workedExamples[0] ? (
                    <div className="mt-5">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-2">Worked example</p>
                      <p className="mt-1 text-sm font-medium">{lesson.workedExamples[0].title}</p>
                      <div className="prose-lesson mt-1 text-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                          {lesson.workedExamples[0].solution}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : null}
                  {lesson.practiceExercise ? (
                    <div className="mt-5 rounded-lg bg-surface-raised p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-2">Practice exercise</p>
                      <p className="mt-1 text-sm">{lesson.practiceExercise.prompt}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <DashboardPreviewCard />
            </ScrollReveal>
          </div>
        ) : null}

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <ScrollReveal key={t.quote} delay={i * 0.08}>
              <Card className="flex h-full flex-col gap-3">
                <p className="text-sm text-foreground">&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-auto text-xs text-muted-2">
                  {t.name} · {t.role}
                </p>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
