"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signIn } from "@/lib/api/auth";
import type { SignInRequest } from "@/types/api";

// Wraps the signIn API call in a TanStack Query mutation.
// Mirrors useSignUp: on success the backend returns tokens, which we persist so
// the axios request interceptor authenticates every subsequent call.
export function useSignIn() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: SignInRequest) => signIn(payload),

    onSuccess: (response) => {
      localStorage.setItem("access_token", response.tokens.accessToken);
      localStorage.setItem("refresh_token", response.tokens.refreshToken);

      toast.success("Welcome back!");
      router.push("/dashboard");
      router.refresh();
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
