import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <main className="flex h-screen overflow-hidden">
      {/* ── Left: image panel ─────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col overflow-hidden" aria-hidden="true">
        <Image
          src="/images/landing/auth/auth1.png"
          alt=""
          fill
          className="object-cover"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-black/45" />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-8 pt-8">
          <span className="text-lg font-semibold text-white">MasteryPath</span>
          <Link
            href="/"
            className="flex items-center justify-center w-[168px] h-[46px] bg-charcoal text-base font-normal text-white transition-colors hover:bg-[#555555]"
          >
            Back to website
          </Link>
        </div>

        {/* Bottom copy */}
        <div className="relative z-10 mt-auto px-8 pb-12">
          <h2 className="text-[2.5rem] font-bold leading-tight text-white">
            Your{" "}
            <i className="font-cormorant-italic">AI</i>
            {" "}will
            <br />
            adapt to you.
          </h2>
          <p className="mt-3 text-sm text-white/60">
            Every lesson, explanation, and example is calibrated
            to exactly where you are right now.
          </p>
          <div className="mt-6 flex gap-2">
            <div className="h-0.5 w-6 rounded-full bg-white/30" />
            <div className="h-0.5 w-6 rounded-full bg-white/30" />
            <div className="h-0.5 w-6 rounded-full bg-white/70" />
          </div>
        </div>
      </div>

      {/* ── Right: form panel ─────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-cream">
        <div className="flex min-h-full items-center justify-center pt-[44px] pb-[120px] px-6 lg:px-[64px]">
          <div className="relative w-full max-w-[506px]">
            {/* Close */}
            <Link
              href="/"
              aria-label="Close"
              className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F5] text-charcoal transition-colors hover:bg-[#E8E8E8]"
            >
              <X className="h-4 w-4" />
            </Link>

            {/* Mobile-only wordmark */}
            <div className="mb-5 lg:hidden">
              <span className="text-xl font-semibold text-[#111111]">MasteryPath</span>
            </div>

            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </main>
  );
}
