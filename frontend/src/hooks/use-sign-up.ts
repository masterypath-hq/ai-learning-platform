"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signUp } from "@/lib/api/auth";
import type { SignUpRequest } from "@/types/api";

// Wraps the signUp API call in a TanStack Query mutation.
//
// Why useMutation instead of useState + try/catch in the form?
//   - isPending, isError, isSuccess are tracked for free — no manual state.
//   - onSuccess / onError callbacks run after the async operation settles.
//   - If the backend returns an accessToken, we store it here so the axios
//     instance automatically includes it in all future requests.
export function useSignUp() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: SignUpRequest) => signUp(payload),

    onSuccess: (response) => {
      // The backend auto-logs-in on sign-up — store both tokens immediately so
      // subsequent API calls are authenticated and the session can be refreshed.
      localStorage.setItem("access_token", response.tokens.accessToken);
      localStorage.setItem("refresh_token", response.tokens.refreshToken);

      toast.success("Account created! Welcome to MasteryPath.");
      // New users go through onboarding (choose subject → skill level → AI
      // builds the course) before landing on the full dashboard.
      router.push("/onboarding");
      router.refresh();
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
