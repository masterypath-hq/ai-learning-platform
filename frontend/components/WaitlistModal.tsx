"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check } from "lucide-react";
import { useJoinWaitlist } from "@/lib/queries/waitlist";
import { Input } from "./Input";
import { Button } from "./Button";

export function WaitlistModal({
  open,
  onClose,
  source,
  title = "Pro launches soon",
  body = "Leave your email and get your first month 50% off when we launch.",
}: {
  open: boolean;
  onClose: () => void;
  source: string;
  title?: string;
  body?: string;
}) {
  const joinWaitlist = useJoinWaitlist();
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await joinWaitlist.mutateAsync({ email, source });
  }

  function handleClose() {
    onClose();
    setTimeout(() => joinWaitlist.reset(), 300);
    setEmail("");
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-xl border border-border bg-surface p-6"
          >
            <button
              onClick={handleClose}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-hover"
            >
              <X className="h-4 w-4" />
            </button>

            {joinWaitlist.isSuccess ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                  <Check className="h-5 w-5 text-success" />
                </div>
                <p className="font-display text-lg font-medium">You&apos;re on the list</p>
                <p className="text-sm text-muted">{joinWaitlist.data?.message}</p>
              </div>
            ) : (
              <>
                <h2 className="font-display text-lg font-medium">{title}</h2>
                <p className="mt-1.5 text-sm text-muted">{body}</p>
                <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button type="submit" isLoading={joinWaitlist.isPending}>
                    Notify me
                  </Button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
