"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Loader } from "./Loader";

/**
 * Tokens live in localStorage, not cookies, so Next middleware (edge, no
 * localStorage access) can't gate routes — this client-side check is the
 * enforcement point instead. Waits for the persisted store to hydrate before
 * deciding, so a logged-in user never flashes a redirect to /login.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (hasHydrated && !accessToken) {
      router.replace("/login");
    }
  }, [hasHydrated, accessToken, router]);

  if (!hasHydrated || !accessToken) {
    return <Loader />;
  }

  return <>{children}</>;
}
