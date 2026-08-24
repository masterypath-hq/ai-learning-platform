"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useExchangeOAuthCode } from "@/lib/queries/auth";
import { Loader } from "@/components/Loader";

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exchangeCode = useExchangeOAuthCode();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const code = searchParams.get("code");
    if (!code) {
      setError("Missing sign-in code. Please try again.");
      return;
    }
    const provider = (sessionStorage.getItem("oauth_provider") as "google" | "github" | null) ?? "google";
    sessionStorage.removeItem("oauth_provider");

    exchangeCode.mutate(
      { provider, code },
      {
        onSuccess: (res) => {
          router.replace(res.isNewUser ? "/register?step=onboarding" : "/dashboard");
        },
        onError: () => {
          setError("Sign-in failed. Please try again.");
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-danger">{error}</p>
        <a href="/login" className="text-sm text-[var(--accent)]">
          Back to login
        </a>
      </div>
    );
  }

  return <Loader label="Signing you in…" />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Loader />}>
      <CallbackInner />
    </Suspense>
  );
}
