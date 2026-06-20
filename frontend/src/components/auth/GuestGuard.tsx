"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// For auth pages (sign-in / sign-up): if the user is already signed in (a token
// is in localStorage), send them straight to the dashboard instead of showing
// the auth form. Renders a loader until the check resolves to avoid a flash.
export function GuestGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      router.replace("/dashboard");
      return;
    }
    setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <main className="flex h-screen items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
      </main>
    );
  }

  return <>{children}</>;
}
