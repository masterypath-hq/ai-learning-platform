import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { GuestGuard } from "@/components/auth/GuestGuard";

export const metadata: Metadata = { title: "Create Account" };

export default function SignUpPage() {
  return (
    <GuestGuard>
    <main className="flex h-screen overflow-hidden">
      {/* ── Left: image panel ─────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col overflow-hidden" aria-hidden="true">
        <Image
          src="/images/landing/auth/auth3.png"
          alt=""
          fill
          className="object-cover"
          sizes="50vw"
        />
        {/* dark overlay */}
        <div className="absolute inset-0 bg-black/45" />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-8 pt-8">
          <span className="text-lg font-semibold text-white">MasteryPath</span>
          <Link
            href="/"
            className="flex items-center justify-center w-[168px] h-[46px] bg-charcoal text-base font-normal text-black transition-colors hover:bg-[#555555]"
          >
            Back to website
          </Link>
        </div>

        {/* Bottom copy */}
        <div className="relative z-10 mt-auto px-8 pb-12">
          <p className="mb-2 text-sm text-white/60">Step 1 of 4</p>
          <h2 className="text-[2.5rem] font-bold leading-tight text-white">
            From{" "}
            <i className="font-cormorant-italic">zero</i>
            <br />
            to mastery.
          </h2>
          <p className="mt-3 text-sm text-white/60">
            Free to start. No credit card. Your first session in under 2 minutes.
          </p>
          {/* Decorative step indicators */}
          <div className="mt-6 flex gap-2">
            <div className="h-0.5 w-6 rounded-full bg-white/70" />
            <div className="h-0.5 w-6 rounded-full bg-white/30" />
            <div className="h-0.5 w-6 rounded-full bg-white/30" />
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

            {/* Header */}
            <div className="mb-6 pr-10">
              <h1 className="font-cormorant font-semibold text-[28px] leading-tight text-teal">
                Create your account
              </h1>
              <p className="mt-1 text-base font-normal text-charcoal">
                Already have an account?{" "}
                <Link
                  href="/sign-in"
                  className="text-teal-dark underline underline-offset-2"
                >
                  Log in
                </Link>
              </p>
            </div>

            <SignUpForm />
          </div>
        </div>
      </div>
    </main>
    </GuestGuard>
  );
}
