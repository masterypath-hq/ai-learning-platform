"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMe, useUpdateMe } from "@/lib/queries/auth";
import { useSubscriptionStatus, useCreatePortalSession, useCancelSubscription } from "@/lib/queries/billing";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { Loader } from "@/components/Loader";

export default function SettingsPage() {
  const { data: profile, isLoading } = useMe();
  const updateMe = useUpdateMe();
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);

  const { data: subscription } = useSubscriptionStatus();
  const createPortalSession = useCreatePortalSession();
  const cancelSubscription = useCancelSubscription();
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  useEffect(() => {
    if (profile?.name) setName(profile.name);
  }, [profile?.name]);

  if (isLoading || !profile) return <Loader />;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    await updateMe.mutateAsync({ name });
    setSaved(true);
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-3xl font-medium">Settings</h1>

      <Card className="mt-6 flex flex-col gap-4">
        <h2 className="font-medium">Profile</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <Input label="Email" value={profile.email} disabled />
          <Input id="name" label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          {saved ? <p className="text-sm text-success">Saved.</p> : null}
          <Button type="submit" isLoading={updateMe.isPending} className="self-start">
            Save changes
          </Button>
        </form>
      </Card>

      <Card className="mt-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium">Subscription</h2>
            <p className="mt-1 text-sm text-muted">
              You&apos;re on the <span className="capitalize">{profile.planTier}</span> plan.
              {subscription?.cancelling && subscription.currentPeriodEnd
                ? ` Access ends ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}.`
                : null}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={profile.planTier === "pro" ? "accent" : "neutral"}>{profile.planTier}</Badge>
            {profile.planTier === "free" ? (
              <Link
                href="/pricing"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]"
              >
                Upgrade
              </Link>
            ) : null}
          </div>
        </div>

        {profile.planTier === "pro" && subscription?.provider === "stripe" ? (
          <Button
            variant="secondary"
            onClick={() => createPortalSession.mutate()}
            isLoading={createPortalSession.isPending}
            className="self-start"
          >
            Manage billing
          </Button>
        ) : null}

        {profile.planTier === "pro" && subscription?.provider === "paystack" && !subscription.cancelling ? (
          confirmingCancel ? (
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted">Cancel your subscription?</p>
              <Button
                variant="danger"
                size="sm"
                onClick={() => cancelSubscription.mutate(undefined, { onSuccess: () => setConfirmingCancel(false) })}
                isLoading={cancelSubscription.isPending}
              >
                Confirm
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmingCancel(false)}>
                Never mind
              </Button>
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setConfirmingCancel(true)} className="self-start">
              Cancel subscription
            </Button>
          )
        ) : null}
      </Card>
    </div>
  );
}
