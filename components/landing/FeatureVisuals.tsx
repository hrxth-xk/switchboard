"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Braces, Briefcase, FileText, StickyNote } from "lucide-react";
import { arcLength, arcPath } from "@/lib/gauge-arc";
import { EASE_OUT } from "@/lib/motion";

const VIEWPORT = { once: true, amount: 0.4 } as const;

/* Spaced repetition — confidence 1-5 maps to 1, 3, 7, 14, or 30 days. */

const CONFIDENCE_STEPS = [
  { score: 1, short: "1d", long: "tomorrow" },
  { score: 2, short: "3d", long: "in 3 days" },
  { score: 3, short: "1w", long: "in a week" },
  { score: 4, short: "2w", long: "in 2 weeks" },
  { score: 5, short: "1mo", long: "in a month" }
] as const;

export function RevisitVisual() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(2);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => setActive((current) => (current + 1) % CONFIDENCE_STEPS.length), 2600);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const step = CONFIDENCE_STEPS[active];
  // Nodes sit at 10/30/50/70/90%; the rail itself starts at the 10% mark.
  const progress = ((active + 0.5) / CONFIDENCE_STEPS.length) * 100 - 10;

  return (
    <div className="lv-revisit">
      <div className="lv-revisit-head">
        <span className="lv-caption">How confident were you?</span>
        <span className="lv-revisit-out">
          Back <strong>{step.long}</strong>
        </span>
      </div>

      <div className="lv-rail">
        <span aria-hidden="true" className="lv-rail-track" />
        <motion.span
          animate={{ width: `${progress}%` }}
          aria-hidden="true"
          className="lv-rail-progress"
          transition={{ duration: 0.5, ease: EASE_OUT }}
        />
        {CONFIDENCE_STEPS.map((item, itemIndex) => (
          <div className={`lv-step${itemIndex === active ? " is-active" : ""}`} key={item.score}>
            <span className="lv-node">{item.score}</span>
            <span className="lv-step-label">{item.short}</span>
          </div>
        ))}
      </div>

      <p className="lv-revisit-foot">
        Rate a problem once. Switchboard queues the revisit and surfaces it the day it&apos;s due.
      </p>
    </div>
  );
}

/* Daily target gauge */

const MINI_PATH = arcPath(60, 60, 44, 220, 140);
const MINI_LENGTH = arcLength(44, 220, 140);

export function GaugeVisual() {
  const percent = 62.5;
  const offset = MINI_LENGTH - (percent / 100) * MINI_LENGTH;

  return (
    <div className="lv-gauge">
      <svg aria-hidden="true" viewBox="0 0 120 120">
        <path d={MINI_PATH} fill="none" stroke="var(--line)" strokeLinecap="round" strokeWidth={6} />
        <motion.path
          d={MINI_PATH}
          fill="none"
          initial={{ strokeDashoffset: MINI_LENGTH }}
          stroke="var(--text)"
          strokeDasharray={MINI_LENGTH}
          strokeLinecap="round"
          strokeWidth={6}
          transition={{ duration: 1, ease: EASE_OUT }}
          viewport={VIEWPORT}
          whileInView={{ strokeDashoffset: offset }}
        />
      </svg>
      <div className="lv-gauge-center">
        <span className="lv-gauge-value">5</span>
        <span className="lv-gauge-label">of 8 done</span>
      </div>
    </div>
  );
}

/* Weekly consistency */

const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"] as const;
const TODAY_INDEX = 3;

/** Per-cell fill percentages, matching how the dashboard's weekly grid reads. */
const WEEK_ROWS = [
  { label: "DSA", fills: [100, 50, 100, 75, 0, 0, 0] },
  { label: "Apps", fills: [100, 100, 67, 67, 0, 0, 0] },
  { label: "Projects", fills: [100, 0, 100, 100, 0, 0, 0] }
] as const;

export function WeeklyVisual() {
  return (
    <div className="lv-week">
      <div className="lv-week-head">
        <span />
        {WEEK_DAYS.map((day, dayIndex) => (
          <span className={`lv-week-day${dayIndex === TODAY_INDEX ? " is-today" : ""}`} key={`${day}-${dayIndex}`}>
            {day}
          </span>
        ))}
      </div>
      {WEEK_ROWS.map((row, rowIndex) => (
        <div className="lv-week-row" key={row.label}>
          <span className="lv-week-label">{row.label}</span>
          {row.fills.map((fill, cellIndex) => (
            // Same classes as WeeklyDayCell, so this stays in step with the app.
            <span
              className={[
                "weekly-cell",
                cellIndex === TODAY_INDEX ? "is-today" : "",
                cellIndex > TODAY_INDEX ? "is-future" : "",
                fill === 0 ? "is-empty" : "",
                fill > 0 && fill < 100 ? "is-partial" : "",
                fill >= 100 ? "is-complete" : ""
              ]
                .filter(Boolean)
                .join(" ")}
              key={`${row.label}-${cellIndex}`}
            >
              <span className="weekly-cell-track">
                <motion.span
                  className="weekly-cell-fill"
                  initial={{ height: 0 }}
                  transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.04 * (cellIndex + rowIndex) }}
                  viewport={VIEWPORT}
                  whileInView={{ height: `${fill}%` }}
                />
              </span>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/* Application pipeline */

const PIPELINE = [
  { stage: "Wishlist", count: 14 },
  { stage: "Applied", count: 38 },
  { stage: "OA", count: 9 },
  { stage: "Interview", count: 4 },
  { stage: "Offer", count: 1 }
] as const;

export function PipelineVisual() {
  const max = Math.max(...PIPELINE.map((item) => item.count));

  return (
    <div className="lv-pipeline">
      {PIPELINE.map((item, itemIndex) => (
        <div className={`lv-pipeline-row${item.stage === "Offer" ? " is-offer" : ""}`} key={item.stage}>
          <span className="lv-pipeline-stage">{item.stage}</span>
          <span className="lv-pipeline-track">
            <motion.span
              className="lv-pipeline-fill"
              initial={{ width: 0 }}
              transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.07 * itemIndex }}
              viewport={VIEWPORT}
              whileInView={{ width: `${Math.max((item.count / max) * 100, 8)}%` }}
            />
          </span>
          <span className="lv-pipeline-count">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

/* Quick Add */

const QUICK_TABS = [
  { label: "DSA", icon: Braces },
  { label: "Application", icon: Briefcase },
  { label: "Project", icon: FileText },
  { label: "Note", icon: StickyNote }
] as const;

export function QuickAddVisual() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => setActive((current) => (current + 1) % QUICK_TABS.length), 2200);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <div className="lv-quick">
      <div className="lv-quick-tabs">
        {QUICK_TABS.map(({ label, icon: Icon }, tabIndex) => (
          <span className={`lv-quick-tab${tabIndex === active ? " is-active" : ""}`} key={label}>
            <Icon aria-hidden="true" size={13} />
            {label}
          </span>
        ))}
      </div>
      <div className="lv-quick-sheet">
        <span className="lv-quick-line is-wide" />
        <span className="lv-quick-line" />
        <span className="lv-quick-line is-short" />
        <span className="lv-quick-submit">Save</span>
      </div>
    </div>
  );
}

/* Activity log */

const ACTIVITY = [
  { mark: "•", label: "Solved Number of Islands", time: "9:12 AM" },
  { mark: "•", label: "Applied to Stripe — Backend Engineer", time: "11:40 AM" },
  { mark: "•", label: "Revisit completed — Two Sum", time: "6:05 PM" }
] as const;

export function ActivityVisual() {
  return (
    <ul className="lv-activity">
      {ACTIVITY.map((entry, entryIndex) => (
        <motion.li
          className="lv-activity-item"
          initial={{ opacity: 0, x: -10 }}
          key={entry.label}
          transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.08 * entryIndex }}
          viewport={VIEWPORT}
          whileInView={{ opacity: 1, x: 0 }}
        >
          <span aria-hidden="true" className="lv-activity-mark">
            {entry.mark}
          </span>
          <span className="lv-activity-label">{entry.label}</span>
          <span className="lv-activity-time">{entry.time}</span>
        </motion.li>
      ))}
    </ul>
  );
}

/* Resume library */

export function ResumeVisual() {
  return (
    <div className="lv-resume">
      <div className="lv-resume-file">
        <span className="lv-resume-icon">
          <FileText aria-hidden="true" size={16} />
        </span>
        <div className="lv-resume-copy">
          <p className="lv-resume-name">backend-v3.pdf</p>
          <p className="lv-resume-meta">Sent to Stripe · 12 Aug</p>
        </div>
        <span className="lv-resume-tag">v3</span>
      </div>
      <div className="lv-resume-stack">
        <span className="lv-resume-ghost">backend-v2.pdf</span>
        <span className="lv-resume-ghost is-faded">backend-v1.pdf</span>
      </div>
    </div>
  );
}
