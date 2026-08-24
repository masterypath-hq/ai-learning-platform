import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CheckoutSessionResponse,
  PortalSessionResponse,
  CancelSubscriptionResponse,
  SubscriptionStatusResponse,
  SubscriptionProvider,
  Currency,
} from "@ai-learning-platform/shared";
import { apiFetch } from "../api-client";
import { useAuthStore } from "../auth-store";

interface Envelope<T> {
  success: boolean;
  data: T;
  error: string | null;
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: (input: { provider: SubscriptionProvider; currency: Currency }) =>
      apiFetch<Envelope<CheckoutSessionResponse>>("/api/v1/billing/checkout-session", {
        method: "POST",
        body: input,
      }).then((r) => r.data),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });
}

export function useCreatePortalSession() {
  return useMutation({
    mutationFn: () =>
      apiFetch<Envelope<PortalSessionResponse>>("/api/v1/billing/portal-session", { method: "POST" }).then(
        (r) => r.data
      ),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<Envelope<CancelSubscriptionResponse>>("/api/v1/billing/cancel", { method: "POST" }).then(
        (r) => r.data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] });
    },
  });
}

export function useSubscriptionStatus() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["billing", "subscription"],
    queryFn: () =>
      apiFetch<Envelope<SubscriptionStatusResponse>>("/api/v1/billing/subscription").then((r) => r.data),
    enabled: !!accessToken,
  });
}
