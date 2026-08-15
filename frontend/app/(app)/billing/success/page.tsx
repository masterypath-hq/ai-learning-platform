"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

export default function BillingSuccessPage() {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["me"] });
    queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] });
  }, [queryClient]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <Card className="flex flex-col items-center gap-4 p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-6 w-6 text-success" />
        </div>
        <h1 className="font-display text-2xl font-medium">You&apos;re on Pro</h1>
        <p className="text-sm text-muted">
          Your subscription is active. Unlimited chat, courses, and quizzes are unlocked.
        </p>
        <Link href="/settings" className="w-full">
          <Button className="w-full">Go to settings</Button>
        </Link>
      </Card>
    </div>
  );
}
