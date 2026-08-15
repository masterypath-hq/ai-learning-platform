import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  SignUpResponse,
  SignInResponse,
  UserProfileResponse,
  GoogleSignInResponse,
  GithubSignInResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
} from "@ai-learning-platform/shared";
import { apiFetch } from "../api-client";
import { useAuthStore } from "../auth-store";

async function establishSession(session: { userId: string; email: string; accessToken: string; refreshToken: string }) {
  useAuthStore.getState().setSession(session);
  const profile = await apiFetch<UserProfileResponse>("/api/auth/me");
  useAuthStore.getState().setProfile({ name: profile.name, planTier: profile.planTier });
}

export function useSignUp() {
  return useMutation({
    mutationFn: async (input: { email: string; password: string; name?: string }) => {
      const res = await apiFetch<SignUpResponse>("/api/auth/sign-up", { method: "POST", body: input, auth: false });
      await establishSession({ userId: res.userId, email: res.email, ...res.tokens });
      return res;
    },
  });
}

export function useSignIn() {
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const res = await apiFetch<SignInResponse>("/api/auth/sign-in", { method: "POST", body: input, auth: false });
      await establishSession({ userId: res.userId, email: res.email, ...res.tokens });
      return res;
    },
  });
}

export function useExchangeOAuthCode() {
  return useMutation({
    mutationFn: async ({ provider, code }: { provider: "google" | "github"; code: string }) => {
      const res = await apiFetch<GoogleSignInResponse | GithubSignInResponse>(`/api/auth/${provider}/exchange`, {
        method: "POST",
        body: { code },
        auth: false,
      });
      await establishSession({ userId: res.userId, email: res.email, ...res.tokens });
      return res;
    },
  });
}

export function useMe() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<UserProfileResponse>("/api/auth/me"),
    enabled: !!accessToken,
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name?: string }) =>
      apiFetch<{ success: boolean; data: UserProfileResponse; error: null }>("/api/auth/me", {
        method: "PATCH",
        body: input,
      }).then((r) => r.data),
    onSuccess: (profile) => {
      useAuthStore.getState().setProfile({ name: profile.name, planTier: profile.planTier });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) =>
      apiFetch<ForgotPasswordResponse>("/api/auth/forgot-password", { method: "POST", body: { email }, auth: false }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: { token: string; newPassword: string }) =>
      apiFetch<ResetPasswordResponse>("/api/auth/reset-password", { method: "POST", body: input, auth: false }),
  });
}
