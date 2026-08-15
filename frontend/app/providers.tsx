"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      <MotionConfig reducedMotion="user">
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
