"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { useForgotPassword } from "@/hooks/use-forgot-password";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormData = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const {
    mutate: requestReset,
    isPending,
    isSuccess,
    variables,
  } = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  function onSubmit(data: FormData) {
    requestReset({ email: data.email });
  }

  // ── Confirmation state (swaps in place once the request succeeds) ──────────
  if (isSuccess) {
    const submittedEmail = variables?.email ?? "your email";
    return (
      <div
        data-theme="auth"
        className="flex flex-col items-center gap-4 pr-10 text-center"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal/10 text-teal">
          <MailCheck className="h-7 w-7" />
        </span>
        <div>
          <h1 className="font-cormorant font-semibold text-[28px] leading-tight text-teal">
            Check your email
          </h1>
          <p className="mt-2 text-base font-normal text-charcoal">
            We sent a password reset link to{" "}
            <span className="font-medium text-[#111111]">{submittedEmail}</span>.
          </p>
        </div>
        <p className="text-sm text-stone">
          Didn&apos;t get it?{" "}
          <button
            type="button"
            onClick={() =>
              requestReset(
                { email: submittedEmail },
                { onSuccess: () => toast.success("Reset link sent again.") }
              )
            }
            disabled={isPending}
            className="text-teal-dark underline underline-offset-2 transition-colors hover:text-teal disabled:opacity-50"
          >
            Resend link
          </button>
        </p>
        <Link
          href="/sign-in"
          className="mt-2 flex items-center justify-center gap-1.5 text-sm text-charcoal transition-colors hover:text-teal"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    );
  }

  // ── Entry state ────────────────────────────────────────────────────────────
  return (
    <div data-theme="auth" className="flex flex-col gap-6">
      <div className="pr-10">
        <h1 className="font-cormorant font-semibold text-[28px] leading-tight text-teal">
          Forgot password?
        </h1>
        <p className="mt-1 text-base font-normal text-charcoal">
          No worries — enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="your@email.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Button
          type="submit"
          size="lg"
          isLoading={isPending}
          className="mt-1 h-12.25 w-full bg-[#1B3829] text-white hover:bg-[#142d1f]"
        >
          Send reset link
        </Button>
      </form>

      <Link
        href="/sign-in"
        className="flex items-center justify-center gap-1.5 text-sm text-charcoal transition-colors hover:text-teal"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </div>
  );
}
