"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AuthShowcase } from "./showcase/AuthShowcase";

export function AuthShell({
  step,
  children,
}: {
  step?: { current: number; total: number };
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <AuthShowcase />
      </div>

      <div className="flex flex-col overflow-y-auto bg-background">
        <div className="flex items-center justify-between p-6">
          <Link href="/" className="flex items-center gap-1.5 font-display text-lg font-medium lg:hidden">
            MasteryPath
          </Link>
          <Link
            href="/"
            className="ml-auto rounded-full border border-border-strong px-4 py-1.5 text-xs font-medium text-muted hover:bg-surface-hover"
          >
            Back to website
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            {step ? (
              <div className="mb-6">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-2">
                  Step {step.current} of {step.total}
                </p>
                <div className="flex gap-1.5">
                  {Array.from({ length: step.total }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                        i < step.current ? "bg-[var(--accent)]" : "bg-surface-raised"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            <AnimatePresence mode="wait">
              <motion.div
                key={step?.current ?? "single"}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
