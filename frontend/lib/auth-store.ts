import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthTokensLike {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  userId: string | null;
  email: string | null;
  name: string | null;
  planTier: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  hasHydrated: boolean;
  setSession: (session: { userId: string; email: string } & AuthTokensLike) => void;
  setTokens: (tokens: AuthTokensLike) => void;
  setProfile: (profile: { name?: string | null; planTier: string }) => void;
  clearSession: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      email: null,
      name: null,
      planTier: null,
      accessToken: null,
      refreshToken: null,
      hasHydrated: false,
      setSession: (session) =>
        set({
          userId: session.userId,
          email: session.email,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        }),
      setTokens: (tokens) => set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
      setProfile: (profile) => set({ name: profile.name ?? null, planTier: profile.planTier }),
      clearSession: () =>
        set({ userId: null, email: null, name: null, planTier: null, accessToken: null, refreshToken: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "masterypath-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
