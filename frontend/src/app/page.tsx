import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsBar } from "@/components/landing/StatsBar";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TracksSection } from "@/components/landing/TracksSection";
import { MemorySection } from "@/components/landing/MemorySection";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTABanner } from "@/components/landing/CTABanner";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="bg-[#EDE8DC] text-[#111111] overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <StatsBar />
      <ProblemSection />
      <HowItWorksSection />
      <TracksSection />
      <MemorySection />
      <PricingSection />
      <CTABanner />
      <Footer />
    </div>
  );
}
