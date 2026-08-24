"use client";

import { useEffect } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Check } from "lucide-react";
import { Card } from "./Card";
import { Button } from "./Button";
import { useAuthStore } from "@/lib/auth-store";
import { useCurrencyStore } from "@/lib/currency-store";
import { currencyToProvider } from "@/lib/currency";
import { useCreateCheckoutSession } from "@/lib/queries/billing";

const FREE_FEATURES = ["5 AI tutor messages / day", "5 knowledge checks / day", "1 preview course"];
const PRO_FEATURES = [
  "Unlimited AI tutor chat",
  "Unlimited courses & quizzes",
  "Full progress history",
  "Priority model access",
];

const PRICE_USD = process.env.NEXT_PUBLIC_PRO_PRICE_USD ?? "19";
const PRICE_NGN = process.env.NEXT_PUBLIC_PRO_PRICE_NGN ?? "25000";

export function PricingTable() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const detectIfNeeded = useCurrencyStore((s) => s.detectIfNeeded);
  const createCheckoutSession = useCreateCheckoutSession();

  useEffect(() => {
    detectIfNeeded();
  }, [detectIfNeeded]);

  const priceLabel = currency === "ngn" ? `₦${Number(PRICE_NGN).toLocaleString()}` : `$${PRICE_USD}`;

  function handleUpgrade() {
    createCheckoutSession.mutate({ provider: currencyToProvider(currency), currency });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center gap-2 text-sm">
        {(["usd", "ngn"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCurrency(c)}
            className={clsx(
              "rounded-full px-3 py-1 font-medium transition-colors",
              currency === c
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "border border-border-strong text-muted hover:bg-surface-hover"
            )}
          >
            {c.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold">Free</h3>
            <p className="mt-1 text-3xl font-semibold">
              {currency === "ngn" ? "₦0" : "$0"}
              <span className="text-base font-normal text-muted"> / month</span>
            </p>
          </div>
          <ul className="flex flex-1 flex-col gap-2 text-sm text-muted">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-muted" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className="rounded-lg border border-border-strong px-4 py-2 text-center text-sm font-medium hover:bg-surface-hover"
          >
            Start free
          </Link>
          <p className="text-center text-xs text-muted-2">No card required</p>
        </Card>

        <Card className="flex flex-col gap-4 border-[var(--accent)]/40 bg-[var(--accent-soft)]">
          <div>
            <h3 className="text-lg font-semibold">Pro</h3>
            <p className="mt-1 text-3xl font-semibold">
              {priceLabel}
              <span className="text-base font-normal text-muted"> / month</span>
            </p>
          </div>
          <ul className="flex flex-1 flex-col gap-2 text-sm">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                {f}
              </li>
            ))}
          </ul>
          {accessToken ? (
            <Button onClick={handleUpgrade} isLoading={createCheckoutSession.isPending} className="w-full">
              Upgrade to Pro
            </Button>
          ) : (
            <Link
              href="/register?next=/pricing"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-center text-sm font-medium text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]"
            >
              Upgrade to Pro
            </Link>
          )}
          {createCheckoutSession.isError ? (
            <p className="text-center text-xs text-danger">Something went wrong starting checkout — try again.</p>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
