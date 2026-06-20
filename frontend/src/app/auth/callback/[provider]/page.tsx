"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useOAuthExchange } from "@/hooks/use-oauth-exchange";
import type { OAuthProvider } from "@/lib/api/auth";

const VALID_PROVIDERS: OAuthProvider[] = ["google", "github"];

function isValidProvider(value: string | undefined): value is OAuthProvider {
  return value !== undefined && VALID_PROVIDERS.includes(value as OAuthProvider);
}

export default function OAuthCallbackPage() {
  const router = useRouter();
  const params = useParams<{ provider: string }>();
  const searchParams = useSearchParams();
  const { mutate: exchange } = useOAuthExchange();

  // React runs effects twice in dev (Strict Mode) and the one-time code can
  // only be exchanged once — guard so we fire exactly one request.
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const provider = params.provider;
    const code = searchParams.get("code");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      toast.error("Sign-in was cancelled or failed. Please try again.");
      router.replace("/sign-in");
      return;
    }

    if (!isValidProvider(provider) || !code) {
      toast.error("Invalid sign-in callback. Please try again.");
      router.replace("/sign-in");
      return;
    }

    exchange({ provider, code });
  }, [params.provider, searchParams, exchange, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
        <p className="font-syne text-base text-charcoal">
          Completing your sign-in&hellip;
        </p>
      </div>
    </main>
  );
}
