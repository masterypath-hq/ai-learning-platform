"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Client-side route guard for authenticated pages. Our JWT lives in localStorage
// (browser-only), so protection has to happen on the client — there's no token
// for the server/middleware to read. Renders a loader until the check completes
// to avoid flashing protected content before a possible redirect.
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/sign-in");
      return;
    }
    setAuthorized(true);
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
