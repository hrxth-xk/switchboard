"use client";

import { MotionConfig } from "framer-motion";
import { ContrastSection } from "@/components/landing/ContrastSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { FeatureBento } from "@/components/landing/FeatureBento";
import { FinalCta } from "@/components/landing/FinalCta";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingTicker } from "@/components/landing/LandingTicker";
import { AmbientBackground } from "@/components/ui/AmbientBackground";

export function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="landing-shell">
        <AmbientBackground tone="marketing" />

        <LandingNav />

        <main className="landing-main">
          <LandingHero />
          <LandingTicker />
          <ContrastSection />
          <FeatureBento />
          <HowItWorks />
          <FaqSection />
          <FinalCta />
        </main>

        <LandingFooter />
      </div>
    </MotionConfig>
  );
}
