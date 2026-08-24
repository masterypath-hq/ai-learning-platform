"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignUp } from "@/lib/queries/auth";
import { useAuthStore } from "@/lib/auth-store";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { OAuthButtons } from "@/components/OAuthButtons";
import { AuthShell } from "@/components/AuthShell";
import { Loader } from "@/components/Loader";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { ApiError } from "@/lib/api-client";
import type { SelfAssessmentLevel } from "@ai-learning-platform/shared";

const VALID_LEVELS: SelfAssessmentLevel[] = ["complete_beginner", "some_exposure", "intermediate", "advanced"];

function RegisterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessToken = useAuthStore((s) => s.accessToken);
  const signUp = useSignUp();

  // OAuth new users land here already authenticated — skip straight to subject/track.
  const [phase, setPhase] = useState<"account" | "onboarding">(
    searchParams.get("step") === "onboarding" ? "onboarding" : "account"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await signUp.mutateAsync({ email, password, name: name || undefined });
      setPhase("onboarding");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (phase === "onboarding") {
    if (!accessToken) {
      return <Loader label="Checking your session…" />;
    }
    const trackParam = searchParams.get("track") ?? undefined;
    const levelParam = searchParams.get("level");
    const initialLevel = VALID_LEVELS.find((l) => l === levelParam);
    return (
      <OnboardingFlow
        onComplete={(courseId) => router.push(`/courses/${courseId}`)}
        initialTrackSlug={trackParam}
        initialLevel={initialLevel}
      />
    );
  }

  return (
    <AuthShell step={{ current: 1, total: 4 }}>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="font-display text-2xl font-medium">Create your account</h1>
          <p className="mt-1 text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--accent)]">
              Log in
            </Link>
          </p>
        </div>

        <OAuthButtons />

        <div className="flex items-center gap-3 text-xs text-muted-2">
          <div className="h-px flex-1 bg-border" />
          or continue with email
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input id="name" type="text" label="Name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            id="email"
            type="email"
            label="Email"
            placeholder="your@email.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="Create a password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" isLoading={signUp.isPending} className="mt-1">
            Create an account
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Loader />}>
      <RegisterInner />
    </Suspense>
  );
}
