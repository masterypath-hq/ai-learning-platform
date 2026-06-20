import { create } from "zustand";

interface UIState {
  // Mobile nav drawer (desktop sidebar is always shown via md:flex)
  mobileNavOpen: boolean;
  toggleMobileNav: () => void;
  setMobileNav: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  mobileNavOpen: false,
  toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
  setMobileNav: (open) => set({ mobileNavOpen: open }),
}));
