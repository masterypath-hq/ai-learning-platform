import type { Metadata } from "next";
import { Cormorant_Garamond, Syne } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import "./globals.css";

// Brand fonts — exposed as CSS variables consumed by globals.css
// (.font-cormorant / .font-syne / body).
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant-var",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-syne-var",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "MasteryPath", template: "%s · MasteryPath" },
  description: "AI-driven adaptive learning platform.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${syne.variable}`}>
      <body>
        <Providers>{children}</Providers>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
