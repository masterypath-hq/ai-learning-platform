"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { exchangeOAuthCode, type OAuthProvider } from "@/lib/api/auth";

// Exchanges the one-time OAuth code (from the backend's redirect) for JWT tokens.
// Same token-persistence + redirect behavior as useSignIn / useSignUp.
export function useOAuthExchange() {
  const router = useRouter();

  return useMutation({
    mutationFn: ({ provider, code }: { provider: OAuthProvider; code: string }) =>
      exchangeOAuthCode(provider, code),

    onSuccess: (response) => {
      localStorage.setItem("access_token", response.tokens.accessToken);
      localStorage.setItem("refresh_token", response.tokens.refreshToken);

      toast.success("Signed in successfully!");
      router.replace("/dashboard");
      router.refresh();
    },

    onError: (error: Error) => {
      toast.error(error.message);
      router.replace("/sign-in");
    },
  });
}
