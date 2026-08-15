"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

export default function BillingCancelPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <Card className="flex flex-col items-center gap-4 p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-raised">
          <X className="h-6 w-6 text-muted" />
        </div>
        <h1 className="font-display text-2xl font-medium">Checkout cancelled</h1>
        <p className="text-sm text-muted">No charge was made. You can upgrade any time from the pricing page.</p>
        <Link href="/pricing" className="w-full">
          <Button variant="secondary" className="w-full">
            Back to pricing
          </Button>
        </Link>
      </Card>
    </div>
  );
}
