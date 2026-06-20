"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Bot,
  BookOpen,
  ClipboardList,
  TrendingUp,
  Brain,
  Settings,
  LogOut,
  ChevronDown,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavSection = { id: string; label: string; items: NavItem[] };

const SECTIONS: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Home", icon: Home },
      { href: "/ai-tutor", label: "AI Tutor", icon: Bot },
      { href: "/lessons", label: "Lessons", icon: BookOpen },
      { href: "/quiz", label: "Quiz", icon: ClipboardList },
    ],
  },
  {
    id: "review",
    label: "Review",
    items: [
      { href: "/progress", label: "Progress", icon: TrendingUp },
      { href: "/ai-memory", label: "AI Memory", icon: Brain },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

// Shared content rendered in both the desktop rail and the mobile drawer.
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleSignOut() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    onNavigate?.();
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 pb-6">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/15 text-sm font-semibold">
          M
        </span>
        <span className="font-cormorant text-base font-semibold">MasteryPath</span>
      </div>

      {/* Nav — grows to fill, pushing the user card to the bottom */}
      <nav className="flex-1 overflow-y-auto px-3">
        {SECTIONS.map((section) => (
          <div key={section.id} className="mb-2">
            <p className="px-3 py-3 font-cormorant text-sm font-medium uppercase leading-normal text-divider">
              {section.label}
            </p>
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors",
                        active
                          ? "bg-off-white font-medium text-teal"
                          : "text-white/80 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              {section.id === "settings" && (
                <li>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <LogOut className="h-4.5 w-4.5 shrink-0" />
                    Log out
                  </button>
                </li>
              )}
            </ul>
          </div>
        ))}
      </nav>

      {/* User card — pinned to the bottom */}
      <div className="mx-3 border-t border-white/10 pt-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/5"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
            T
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">Tolu A.</span>
            <span className="block truncate text-xs text-white/50">
              Free · 5 msgs/day
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-white/50" />
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  const { mobileNavOpen, setMobileNav } = useUIStore();

  return (
    <>
      {/* Desktop: fixed rail (md and up) */}
      <aside className="hidden h-screen w-[266px] shrink-0 flex-col border border-[#DFE3FF] bg-teal py-6 text-white md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile: off-canvas drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
          mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileNav(false)}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[266px] max-w-[80vw] flex-col border-r border-[#DFE3FF] bg-teal py-6 text-white transition-transform duration-200 md:hidden",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!mobileNavOpen}
      >
        <button
          type="button"
          onClick={() => setMobileNav(false)}
          aria-label="Close menu"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarContent onNavigate={() => setMobileNav(false)} />
      </aside>
    </>
  );
}
