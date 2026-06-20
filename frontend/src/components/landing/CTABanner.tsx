import Link from "next/link";

export function CTABanner() {
  return (
    <section className="relative overflow-hidden bg-[#0d1f1f] py-[104px]">
      {/* Wave background layers */}
      <div className="absolute inset-0 pointer-events-none cta-glow-1" />
      <div className="absolute inset-0 pointer-events-none opacity-40 cta-glow-2" />

      {/* Content */}
      <div className="relative mx-auto flex w-[562px] max-w-full flex-col items-center gap-7 text-center">
        <h2 className="font-cormorant w-full text-[52px] font-medium text-white leading-[63px]">
          Your tutor is
          <br />
          <span className="font-cormorant italic">
            waiting
          </span>
          {" "}for you
        </h2>

        <p className="font-syne font-normal w-full text-[20px] text-[#F5F5F5] leading-6">
          Free to start. No credit card. Your first session in under 2 minutes.
        </p>

        <Link
          href="/sign-up"
          className="font-syne font-normal transition-colors inline-flex items-center justify-center h-11.5 px-7 text-base bg-white text-teal"
        >
          Start learning
        </Link>
      </div>
    </section>
  );
}
