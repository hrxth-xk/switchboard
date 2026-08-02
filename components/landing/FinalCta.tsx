"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";

export function FinalCta() {
  return (
    <section className="landing-section landing-section-cta">
      <div className="landing-container">
        <Reveal className="landing-cta-card">
          <div aria-hidden="true" className="landing-cta-glow" />
          <span className="landing-eyebrow">Start today</span>
          <h2 className="landing-cta-title">The offer comes from a hundred ordinary days.</h2>
          <p className="landing-cta-lede">
            Pick your three numbers, log today&apos;s work, and let the dashboard tell you when you&apos;re
            done. Tomorrow it&apos;ll be waiting with the revisits you earned.
          </p>
          <div className="landing-cta-actions">
            <Link className="landing-btn landing-btn-primary landing-btn-lg" href="/signup">
              Create your account
              <ArrowRight aria-hidden="true" className="landing-btn-arrow" size={18} />
            </Link>
            <Link className="landing-btn landing-btn-ghost landing-btn-lg" href="/login">
              I already have one
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
