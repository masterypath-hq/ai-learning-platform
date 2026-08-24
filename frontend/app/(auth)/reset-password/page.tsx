"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useResetPassword } from "@/lib/queries/auth";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { AuthShell } from "@/components/AuthShell";
import { Loader } from "@/components/Loader";
import { ApiError } from "@/lib/api-client";

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const resetPassword = useResetPassword();
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await resetPassword.mutateAsync({ token, newPassword });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  return (
    <AuthShell>
      {!token ? (
        <p className="text-center text-sm text-danger">Missing or invalid reset link.</p>
      ) : (
        <div className="flex flex-col gap-5">
          <h1 className="font-display text-2xl font-medium">Set a new password</h1>

          {done ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-success">Password updated. You can log in now.</p>
              <Link href="/login" className="text-sm text-[var(--accent)]">
                Go to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Input
                id="newPassword"
                type="password"
                label="New password"
                minLength={8}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <Button type="submit" isLoading={resetPassword.isPending}>
                Update password
              </Button>
            </form>
          )}
        </div>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loader />}>
      <ResetPasswordInner />
    </Suspense>
  );
}
