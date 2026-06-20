import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A parent package-lock.json exists (C:\Users\pc\package-lock.json), so Next
  // would otherwise warn about an ambiguous workspace root. Pin tracing here.
  outputFileTracingRoot: __dirname,
  // Serve images raw (no optimizer). The dev image-optimizer pipeline is broken
  // in this environment ("isn't a valid image … received null"); raw serving
  // works and is fine for local dev / MVP. Revisit (+ install sharp) later.
  images: { unoptimized: true },
};

export default nextConfig;
