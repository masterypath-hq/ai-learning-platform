"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { useGenerateCurriculum } from "@/hooks/use-generate-curriculum";
import { TrackSelector } from "./TrackSelector";
import { GoalForm } from "./GoalForm";
import { ScheduleForm } from "./ScheduleForm";
import { Button } from "@/components/ui/Button";
import type { Track, SkillLevel } from "@/types/learning";

const schema = z.object({
  track: z.enum(["python", "ai-engineering", "forex", "stocks"] as [Track, ...Track[]], {
    message: "Select a learning track",
  }),
  goal: z.string().min(20, "Describe your goal in at least 20 characters"),
  skillLevel: z.enum(["beginner", "intermediate", "advanced"] as [SkillLevel, ...SkillLevel[]], {
    message: "Select your skill level",
  }),
  hoursPerWeek: z
    .number({ message: "Select a weekly commitment" })
    .min(1, "At least 1 hour per week"),
  targetDate: z.string().optional(),
});

export type JourneyFormData = z.infer<typeof schema>;

const STEPS = [
  { id: 1, title: "Choose a Track", description: "What do you want to master?" },
  { id: 2, title: "Define Your Goal", description: "Tell the AI what success looks like for you." },
  { id: 3, title: "Set Your Schedule", description: "How much time can you commit?" },
];

export function JourneyWizard() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  // Token lives in localStorage (browser-only), so read it after mount.
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    setToken(localStorage.getItem("access_token"));
  }, []);

  const { mutateAsync: generate, isPending } = useGenerateCurriculum(token);

  const methods = useForm<JourneyFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      hoursPerWeek: 5,
    },
  });

  const { handleSubmit, trigger, watch, setValue, formState: { errors } } = methods;

  async function goNext() {
    let valid = false;
    if (step === 1) valid = await trigger("track");
    if (step === 2) valid = await trigger(["goal", "skillLevel"]);
    if (step === 3) valid = true;
    if (valid) setStep((s) => s + 1);
  }

  async function onSubmit(data: JourneyFormData) {
    try {
      const result = await generate({
        track: data.track,
        goal: data.goal,
        skillLevel: data.skillLevel,
        hoursPerWeek: data.hoursPerWeek,
        targetDate: data.targetDate,
      });
      toast.success("Your learning journey is ready!");
      router.push(`/session/${result.data.sessionId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate curriculum");
    }
  }

  const currentStepMeta = STEPS[step - 1];

  return (
    <div className="mx-auto max-w-2xl">
      {/* Step indicators */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={
                step > s.id
                  ? "flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-success)] text-xs font-bold text-white"
                  : step === s.id
                  ? "flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs font-bold text-white"
                  : "flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] text-xs text-[var(--color-text-muted)]"
              }
            >
              {step > s.id ? "✓" : s.id}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={
                  step > s.id
                    ? "h-px w-12 bg-[var(--color-success)]"
                    : "h-px w-12 bg-[var(--color-border)]"
                }
              />
            )}
          </div>
        ))}
      </div>

      {/* Step header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
          {currentStepMeta.title}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {currentStepMeta.description}
        </p>
      </div>

      {/* Step content */}
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            {step === 1 && (
              <TrackSelector
                value={watch("track") ?? null}
                onChange={(t) => setValue("track", t)}
                error={errors.track?.message}
              />
            )}
            {step === 2 && <GoalForm />}
            {step === 3 && <ScheduleForm />}
          </div>

          {/* Navigation */}
          <div className="mt-5 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 1}
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>

            {step < 3 ? (
              <Button type="button" onClick={goNext}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" isLoading={isPending} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate My Journey
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
