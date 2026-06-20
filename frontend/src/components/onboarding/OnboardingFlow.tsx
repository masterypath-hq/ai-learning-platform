"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubjectSelection, type SelectedCourse } from "./SubjectSelection";
import { SkillLevel } from "./SkillLevel";
import { BuildingCurriculum } from "./BuildingCurriculum";

type Step = "subject" | "level" | "building";

const STEP_DOTS = ["dot-1", "dot-2", "dot-3", "dot-4"];

export function OnboardingFlow() {
  const [step, setStep] = useState<Step>("subject");
  const [course, setCourse] = useState<SelectedCourse | null>(null);
  const [level, setLevel] = useState<string>("beginner");

  // Step 2 uses auth2 + "One track" copy; steps 3–4 share auth1 + "Your AI"
  // copy (matching the Figma "Step 3 of 4" frames).
  const left =
    step === "subject"
      ? { image: "/images/landing/auth/auth2.png", eyebrow: "Step 2 of 4", filled: 2 }
      : { image: "/images/landing/auth/auth1.png", eyebrow: "Step 3 of 4", filled: 3 };

  return (
    <main className="flex h-screen overflow-hidden">
      {/* ── Left: image panel ─────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col overflow-hidden" aria-hidden="true">
        <Image src={left.image} alt="" fill className="object-cover" sizes="50vw" />
        <div className="absolute inset-0 bg-black/45" />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-8 pt-8">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/15 text-sm font-semibold text-white">
              M
            </span>
            <span className="text-lg font-semibold text-white">MasteryPath</span>
          </div>
          <Link
            href="/"
            className="flex items-center justify-center w-[168px] h-[46px] bg-charcoal text-base font-normal text-white transition-colors hover:bg-[#555555]"
          >
            Back to website
          </Link>
        </div>

        {/* Bottom copy */}
        <div className="relative z-10 mt-auto px-8 pb-12">
          <p className="font-cormorant text-base text-white/70">{left.eyebrow}</p>
          <h2 className="mt-2 text-[2.5rem] font-bold leading-tight text-white">
            {step === "subject" ? (
              <>
                One <i className="font-cormorant-italic text-teal-light">track.</i>
                <br />
                Full mastery.
              </>
            ) : (
              <>
                Your <i className="font-cormorant-italic text-teal-light">AI</i> will
                <br />
                adapt to you.
              </>
            )}
          </h2>
          <p className="mt-3 max-w-md text-sm text-white/60">
            {step === "subject"
              ? "Pick the one skill you want to build first. Your AI builds the whole curriculum around it."
              : "Every lesson, explanation, and example is calibrated to exactly where you are right now."}
          </p>
          <div className="mt-6 flex gap-2">
            {STEP_DOTS.map((id, i) => (
              <div
                key={id}
                className={cn(
                  "h-0.5 w-6 rounded-full",
                  i < left.filled ? "bg-white/70" : "bg-white/30"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: step panel ─────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-cream">
        <div className="flex min-h-full items-center justify-center pt-[44px] pb-[120px] px-6 lg:px-[64px]">
          <div className="relative w-full max-w-[506px]">
            {/* Close (hidden while the curriculum is building) */}
            {step !== "building" && (
              <Link
                href="/"
                aria-label="Close"
                className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F5] text-charcoal transition-colors hover:bg-[#E8E8E8]"
              >
                <X className="h-4 w-4" />
              </Link>
            )}

            {/* Mobile-only wordmark */}
            <div className="mb-5 lg:hidden">
              <span className="text-xl font-semibold text-[#111111]">MasteryPath</span>
            </div>

            {step === "subject" && (
              <SubjectSelection
                onContinue={(c) => {
                  setCourse(c);
                  setStep("level");
                }}
              />
            )}
            {step === "level" && (
              <SkillLevel
                onContinue={(lvl) => {
                  setLevel(lvl);
                  setStep("building");
                }}
              />
            )}
            {step === "building" && (
              <BuildingCurriculum
                courseName={course?.name ?? "your subject"}
                level={level}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
