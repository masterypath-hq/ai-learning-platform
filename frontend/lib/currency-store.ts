import { create } from "zustand";
import { persist } from "zustand/middleware";
import { detectCurrencyFromTimezone, type Currency } from "./currency";

interface CurrencyState {
  currency: Currency;
  hasDetected: boolean;
  setCurrency: (currency: Currency) => void;
  detectIfNeeded: () => void;
}

/**
 * Separate from auth-store so the pricing preference survives logout — a
 * logged-out visitor should still see the currency their browser suggests.
 */
export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: "usd",
      hasDetected: false,
      setCurrency: (currency) => set({ currency }),
      detectIfNeeded: () => {
        if (!get().hasDetected) {
          set({ currency: detectCurrencyFromTimezone(), hasDetected: true });
        }
      },
    }),
    { name: "masterypath-currency" }
  )
);
