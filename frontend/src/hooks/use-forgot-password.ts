"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { forgotPassword } from "@/lib/api/auth";
import type { ForgotPasswordRequest } from "@/types/api";

// Requests a password-reset email. No redirect or token storage — the form swaps
// to its "check your email" confirmation based on the mutation's isSuccess flag.
export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordRequest) => forgotPassword(payload),
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
