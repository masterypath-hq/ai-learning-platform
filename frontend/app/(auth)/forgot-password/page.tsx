"use client";

import { useState } from "react";
import Link from "next/link";
import { useForgotPassword } from "@/lib/queries/auth";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { AuthShell } from "@/components/AuthShell";

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await forgotPassword.mutateAsync(email);
    setSent(true);
  }

  return (
    <AuthShell>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="font-display text-2xl font-medium">Reset your password</h1>
          <p className="mt-1 text-sm text-muted">We&apos;ll email you a reset link.</p>
        </div>

        {sent ? (
          <p className="text-sm text-success">If an account exists for that email, a reset link is on its way.</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="your@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" isLoading={forgotPassword.isPending}>
              Send reset link
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted">
          <Link href="/login" className="text-[var(--accent)]">
            Back to login
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
