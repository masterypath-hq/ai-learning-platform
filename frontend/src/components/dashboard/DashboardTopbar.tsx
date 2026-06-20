"use client";

import { Search, Bell, Mail, ChevronDown, Menu } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

export function DashboardTopbar() {
  const toggleMobileNav = useUIStore((s) => s.toggleMobileNav);

  return (
    <header className="flex shrink-0 items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 lg:px-8">
      {/* Mobile menu toggle */}
      <button
        type="button"
        onClick={toggleMobileNav}
        aria-label="Open menu"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-charcoal transition-colors hover:bg-blush md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="relative w-full max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
        <input
          type="search"
          placeholder="Search lessons, topics…"
          className="h-11 w-full rounded-full border border-divider bg-white pl-11 pr-4 text-sm text-charcoal placeholder:text-stone focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
      </div>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-charcoal transition-colors hover:bg-blush"
        >
          <Bell className="h-4.5 w-4.5" />
        </button>
        <button
          type="button"
          aria-label="Messages"
          className="hidden h-10 w-10 items-center justify-center rounded-full bg-white text-charcoal transition-colors hover:bg-blush sm:flex"
        >
          <Mail className="h-4.5 w-4.5" />
        </button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-1 transition-colors hover:bg-blush sm:pr-3"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal text-xs font-semibold text-white">
            T
          </span>
          <span className="hidden text-sm font-medium text-charcoal sm:inline">
            Tolu A
          </span>
          <ChevronDown className="hidden h-4 w-4 text-stone sm:inline" />
        </button>
      </div>
    </header>
  );
}
