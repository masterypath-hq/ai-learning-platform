"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, MessagesSquare, Settings, LogOut, Sparkles } from "lucide-react";
import clsx from "clsx";
import { useAuthStore } from "@/lib/auth-store";
import { ThemeToggle } from "./ThemeToggle";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/chat", label: "AI Tutor", icon: MessagesSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

function initials(name: string | null, email: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return (email?.[0] ?? "?").toUpperCase();
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);
  const name = useAuthStore((s) => s.name);
  const email = useAuthStore((s) => s.email);
  const planTier = useAuthStore((s) => s.planTier);

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/dashboard" className="flex items-center gap-1.5 font-display text-lg font-medium">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            MasteryPath
          </Link>
          <ThemeToggle />
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          <p className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-2">Overview</p>
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-[var(--accent)]" : "text-muted hover:text-foreground"
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-[var(--accent-soft)]"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                ) : null}
                <Icon className="relative h-4 w-4" />
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)]">
              {initials(name, email)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{name || email}</p>
              <p className="truncate text-xs text-muted-2">
                {planTier === "pro" ? "Pro · Unlimited" : "Free · 5 msgs/day"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Log out"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-hover hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
          {planTier === "free" ? (
            <Link
              href="/pricing"
              className="mt-2 flex items-center justify-center rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-medium text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]"
            >
              Upgrade to Pro
            </Link>
          ) : null}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
