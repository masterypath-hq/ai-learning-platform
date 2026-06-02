import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Learning Platform",
  description: "MasteryPath learning platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
