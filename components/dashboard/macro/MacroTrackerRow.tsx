"use client";

import Link from "next/link";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import type { PeriodCounts } from "@/lib/progress-metrics";
import { METRIC_HREFS, METRIC_LABELS, type MetricKey } from "@/lib/progress-metrics";

const METRIC_ORDER: MetricKey[] = ["dsa", "applications", "projects"];

type MacroTrackerRowProps = {
  counts: PeriodCounts;
  targets: PeriodCounts;
};

export function MacroTrackerRow({ counts, targets }: MacroTrackerRowProps) {
  return (
    <div className="macro-trackers">
      {METRIC_ORDER.map((key) => {
        const done = counts[key];
        const target = targets[key];
        const fill = target > 0 ? Math.min((done / target) * 100, 100) : 0;
        const fillTone = fill >= 100 ? "positive" : fill > 0 ? "attention" : "neutral";

        return (
          <Link key={key} href={METRIC_HREFS[key]} className="macro-tracker-col" prefetch={false}>
            <span className="macro-tracker-label">{METRIC_LABELS[key]}</span>
            <div className="macro-tracker-track">
              <div className={`macro-tracker-fill tone-${fillTone}`} style={{ width: `${fill}%` }} />
            </div>
            <span className="macro-tracker-count">
              <AnimatedNumber value={done} /> / <AnimatedNumber value={target} />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
