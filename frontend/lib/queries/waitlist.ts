import { useMutation } from "@tanstack/react-query";
import type { JoinWaitlistRequest, JoinWaitlistResponse } from "@ai-learning-platform/shared";
import { apiFetch } from "../api-client";

interface Envelope<T> {
  success: boolean;
  data: T;
  error: unknown;
}

export function useJoinWaitlist() {
  return useMutation({
    mutationFn: (input: JoinWaitlistRequest) =>
      apiFetch<Envelope<JoinWaitlistResponse>>("/api/auth/waitlist", { method: "POST", body: input, auth: false }).then(
        (r) => r.data
      ),
  });
}
