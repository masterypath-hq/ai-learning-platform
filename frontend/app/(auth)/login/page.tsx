"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn } from "@/lib/queries/auth";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { OAuthButtons } from "@/components/OAuthButtons";
import { AuthShell } from "@/components/AuthShell";
import { ApiError } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const signIn = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await signIn.mutateAsync({ email, password });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <AuthShell>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="font-display text-2xl font-medium">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[var(--accent)]">
              Sign up
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
            placeholder="Your password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-muted hover:text-foreground">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" isLoading={signIn.isPending} className="mt-1">
            Log in
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
