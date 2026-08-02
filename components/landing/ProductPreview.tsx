"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ActionCardsGrid } from "@/components/dashboard/action/ActionCardsGrid";
import { DailyPage } from "@/components/dashboard/macro/DailyPage";
import { MonthlyPage } from "@/components/dashboard/macro/MonthlyPage";
import { WeeklyPage } from "@/components/dashboard/macro/WeeklyPage";
import type { ActionCardsData } from "@/lib/action-dashboard";
import type { MonthlyActivityTrend } from "@/lib/monthly-activity-trend";
import { buildPeriodProgress, type PeriodCounts } from "@/lib/progress-metrics";
import type { WeeklyDayBreakdown } from "@/lib/weekly-breakdown";

/*
 * The preview renders the real dashboard components against fixed sample data,
 * so anything that changes in the product changes here too. The story is a
 * Thursday, 13 August: goals of 4 DSA / 3 applications / 1 project session.
 */

const DAILY_TARGETS: PeriodCounts = { dsa: 4, applications: 3, projects: 1 };
const DAYS_IN_MONTH = 31;

const DAILY_PROGRESS = buildPeriodProgress({ dsa: 3, applications: 2, projects: 1 }, DAILY_TARGETS);

const WEEKLY_COUNTS: PeriodCounts[] = [
  { dsa: 4, applications: 3, projects: 1 },
  { dsa: 2, applications: 3, projects: 0 },
  { dsa: 4, applications: 2, projects: 1 },
  { dsa: 3, applications: 2, projects: 1 },
  { dsa: 0, applications: 0, projects: 0 },
  { dsa: 0, applications: 0, projects: 0 },
  { dsa: 0, applications: 0, projects: 0 }
];

const WEEKLY_BREAKDOWN: WeeklyDayBreakdown[] = ["M", "T", "W", "T", "F", "S", "S"].map((shortLabel, index) => ({
  shortLabel,
  dayNumber: 10 + index,
  isToday: index === 3,
  isFuture: index > 3,
  counts: WEEKLY_COUNTS[index],
  targets: DAILY_TARGETS
}));

const MONTHLY_COUNTS: PeriodCounts = { dsa: 46, applications: 39, projects: 11 };
const MONTHLY_TARGETS: PeriodCounts = {
  dsa: DAILY_TARGETS.dsa * DAYS_IN_MONTH,
  applications: DAILY_TARGETS.applications * DAYS_IN_MONTH,
  projects: DAILY_TARGETS.projects * DAYS_IN_MONTH
};

const MONTHLY_PROGRESS = {
  counts: MONTHLY_COUNTS,
  targets: MONTHLY_TARGETS,
  differences: {
    dsa: MONTHLY_COUNTS.dsa - MONTHLY_TARGETS.dsa,
    applications: MONTHLY_COUNTS.applications - MONTHLY_TARGETS.applications,
    projects: MONTHLY_COUNTS.projects - MONTHLY_TARGETS.projects
  }
};

/** Thirty days of day-completion scores; the last one is "today". */
const TREND_SCORES = [
  62, 88, 100, 45, 0, 30, 74, 92, 100, 58, 66, 0, 41, 83, 100, 71, 54, 96, 38, 0, 62, 88, 79, 100, 45, 67, 91,
  100, 72, DAILY_PROGRESS.percent
];

const ACTIVITY_TREND: MonthlyActivityTrend = {
  days: TREND_SCORES.map((completionPercent, index) => ({
    completionPercent,
    isToday: index === TREND_SCORES.length - 1
  })),
  dailyTarget: DAILY_TARGETS.dsa + DAILY_TARGETS.applications + DAILY_TARGETS.projects
};

const ACTION_CARDS: ActionCardsData = {
  activity: { count: 9, metric: "9 updates today", tone: "positive" },
  dsa: { metric: "2 revisits due", tone: "attention" },
  applications: { count: 41, metric: "41 applications till date", tone: "positive" },
  projects: { count: 2, metric: "2 Active Projects", tone: "positive" }
};

const PERIOD_LABELS = ["today's progress", "this week's progress", "this month's progress"] as const;

/**
 * Wraps a slice of the mock. `aria-hidden` alone would leave the dashboard's
 * links focusable, so `inert` is set from an effect — React 18 has no prop for
 * it — with pointer-events off in CSS as the fallback.
 */
function InertBlock({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.setAttribute("inert", "");
  }, []);

  return (
    <div aria-hidden="true" className="landing-preview-inert" ref={ref}>
      {children}
    </div>
  );
}

export function ProductPreview() {
  const stageRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reduceMotion = useReducedMotion();
  const inView = useInView(stageRef, { amount: 0.3 });
  const [index, setIndex] = useState(0);
  const [pinned, setPinned] = useState(false);
  const [slideHeights, setSlideHeights] = useState<number[]>([]);

  const { scrollYProgress } = useScroll({ target: stageRef, offset: ["start 0.95", "start 0.35"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [11, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1]);

  // Mirror the app's carousel: the viewport takes the height of the live slide.
  useLayoutEffect(() => {
    const slides = slideRefs.current.filter(Boolean) as HTMLElement[];
    if (!slides.length) return;

    const measure = () => setSlideHeights(slides.map((slide) => slide.getBoundingClientRect().height));
    measure();

    const observers = slides.map((slide) => {
      const observer = new ResizeObserver(measure);
      observer.observe(slide);
      return observer;
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, []);

  useEffect(() => {
    if (reduceMotion || pinned || !inView) return;
    const id = window.setInterval(() => setIndex((current) => (current + 1) % PERIOD_LABELS.length), 4600);
    return () => window.clearInterval(id);
  }, [reduceMotion, pinned, inView]);

  function setSlideRef(slideIndex: number) {
    return (element: HTMLDivElement | null) => {
      slideRefs.current[slideIndex] = element;
    };
  }

  const activeHeight = slideHeights[index];

  return (
    <div className="landing-preview-stage" ref={stageRef}>
      <div aria-hidden="true" className="landing-preview-glow" />

      <motion.div className="landing-preview-frame" style={reduceMotion ? undefined : { rotateX, scale }}>
        <div className="landing-preview-chrome">
          <span aria-hidden="true" className="landing-preview-lights">
            <i />
            <i />
            <i />
          </span>
          <span className="landing-preview-url">switchboard / dashboard</span>
        </div>

        <div className="landing-preview-body">
          <div className="macro-dashboard">
            <InertBlock>
              <header className="macro-hero">
                <p className="macro-hero-date">Thursday, August 13</p>
                <p className="macro-hero-title">Dashboard</p>
                <p className="macro-hero-tagline">Stay on pace. Small wins compound.</p>
              </header>

              <div
                className="macro-carousel-viewport"
                style={activeHeight ? { height: activeHeight } : undefined}
              >
                <div
                  className="macro-carousel-track"
                  style={{ width: "300%", transform: `translate3d(-${(index * 100) / 3}%, 0, 0)` }}
                >
                  <div className="macro-page" ref={setSlideRef(0)} style={{ flex: "0 0 33.3333%" }}>
                    <DailyPage progress={DAILY_PROGRESS} />
                  </div>
                  <div className="macro-page" ref={setSlideRef(1)} style={{ flex: "0 0 33.3333%" }}>
                    <WeeklyPage days={WEEKLY_BREAKDOWN} />
                  </div>
                  <div className="macro-page" ref={setSlideRef(2)} style={{ flex: "0 0 33.3333%" }}>
                    <MonthlyPage activityTrend={ACTIVITY_TREND} monthly={MONTHLY_PROGRESS} />
                  </div>
                </div>
              </div>
            </InertBlock>

            <div aria-label="Preview the dashboard periods" className="macro-dots" role="group">
              {PERIOD_LABELS.map((label, dotIndex) => (
                <button
                  aria-label={`Show ${label}`}
                  aria-pressed={dotIndex === index}
                  className={`macro-dot landing-preview-dot${dotIndex === index ? " active" : ""}`}
                  key={label}
                  onClick={() => {
                    setIndex(dotIndex);
                    setPinned(true);
                  }}
                  type="button"
                />
              ))}
            </div>

            <InertBlock>
              <ActionCardsGrid cards={ACTION_CARDS} />
            </InertBlock>
          </div>
        </div>
      </motion.div>

      <div aria-hidden="true" className="landing-preview-float landing-preview-float-a">
        <span className="landing-float-dot" />
        <div>
          <p className="landing-float-title">Revisit due</p>
          <p className="landing-float-meta">Course Schedule · rated 3/5</p>
        </div>
      </div>

      <div aria-hidden="true" className="landing-preview-float landing-preview-float-b">
        <span className="landing-float-dot is-positive" />
        <div>
          <p className="landing-float-title">Moved to Interview</p>
          <p className="landing-float-meta">Datadog · Software Engineer II</p>
        </div>
      </div>
    </div>
  );
}
