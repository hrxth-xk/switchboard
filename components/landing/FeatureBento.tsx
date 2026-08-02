"use client";

import type { MouseEvent, ReactNode } from "react";
import { motion } from "framer-motion";
import { Braces, Briefcase, CalendarCheck, FileText, Gauge, ListChecks, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  ActivityVisual,
  GaugeVisual,
  PipelineVisual,
  QuickAddVisual,
  ResumeVisual,
  RevisitVisual,
  WeeklyVisual
} from "@/components/landing/FeatureVisuals";
import { Reveal } from "@/components/landing/Reveal";
import { EASE_OUT } from "@/lib/motion";

type TileProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  span?: 1 | 2;
  delay?: number;
  children: ReactNode;
};

/** Tracks the pointer so each tile can light up under the cursor. */
function handlePointer(event: MouseEvent<HTMLElement>) {
  const bounds = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--spot-x", `${event.clientX - bounds.left}px`);
  event.currentTarget.style.setProperty("--spot-y", `${event.clientY - bounds.top}px`);
}

function BentoTile({ icon: Icon, title, description, span = 1, delay = 0, children }: TileProps) {
  return (
    <motion.article
      className={`landing-tile${span === 2 ? " is-wide" : ""}`}
      initial={{ opacity: 0, y: 22 }}
      onMouseMove={handlePointer}
      transition={{ duration: 0.55, ease: EASE_OUT, delay }}
      viewport={{ once: true, amount: 0.2 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div className="landing-tile-head">
        <span className="landing-tile-icon">
          <Icon aria-hidden="true" size={17} />
        </span>
        <h3 className="landing-tile-title">{title}</h3>
      </div>
      <p className="landing-tile-desc">{description}</p>
      <div className="landing-tile-visual">{children}</div>
    </motion.article>
  );
}

export function FeatureBento() {
  return (
    <section className="landing-section" id="features">
      <div className="landing-container">
        <Reveal as="header" className="landing-section-head">
          <span className="landing-eyebrow">What&apos;s inside</span>
          <h2 className="landing-section-title">Everything the search needs. Nothing it doesn&apos;t.</h2>
          <p className="landing-section-lede">
            Switchboard is deliberately small. Four screens, one quick-add sheet, and a scoreboard that keeps
            you honest — designed so logging a day takes less time than opening a spreadsheet.
          </p>
        </Reveal>

        <div className="landing-bento">
          <BentoTile
            description="Rate a problem 1 to 5 when you solve it and the revisit is scheduled for you — tomorrow, 3 days, a week, 2 weeks, or a month out. Due problems land on your DSA screen the morning they're ready."
            icon={Braces}
            span={2}
            title="Spaced repetition that actually runs"
          >
            <RevisitVisual />
          </BentoTile>

          <BentoTile
            delay={0.06}
            description="Set a daily number for DSA, applications, and project sessions. The gauge counts down what's left."
            icon={Gauge}
            title="Targets, not vibes"
          >
            <GaugeVisual />
          </BentoTile>

          <BentoTile
            description="Today, this week, this month — swipe between them and see where the week actually went."
            icon={CalendarCheck}
            title="Consistency at a glance"
          >
            <WeeklyVisual />
          </BentoTile>

          <BentoTile
            delay={0.06}
            description="Wishlist, Applied, OA, Interview, Offer, Rejected. Every role carries its job link, notes, and next step, so you always know which stage needs you today."
            icon={Briefcase}
            span={2}
            title="A pipeline from wishlist to offer"
          >
            <PipelineVisual />
          </BentoTile>

          <BentoTile
            description="One floating button opens one sheet: DSA, application, project, or note. Log it in seconds and get back to work."
            icon={Zap}
            title="Quick Add, one tap away"
          >
            <QuickAddVisual />
          </BentoTile>

          <BentoTile
            delay={0.06}
            description="Every change is logged automatically. Filter by day, search it, and see proof the week happened."
            icon={ListChecks}
            title="An honest activity log"
          >
            <ActivityVisual />
          </BentoTile>

          <BentoTile
            delay={0.12}
            description="Keep resume versions in one library and attach the exact file you sent to each application."
            icon={FileText}
            title="Resumes, versioned"
          >
            <ResumeVisual />
          </BentoTile>
        </div>
      </div>
    </section>
  );
}
