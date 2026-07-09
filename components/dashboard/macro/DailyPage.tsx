"use client";

import type { PeriodProgress } from "@/lib/progress-metrics";
import { MacroGaugeRow } from "@/components/dashboard/macro/MacroGaugeRow";
import { MacroTrackerRow } from "@/components/dashboard/macro/MacroTrackerRow";

type DailyPageProps = {
  progress: PeriodProgress;
};

export function DailyPage({ progress }: DailyPageProps) {
  return (
    <div className="macro-panel macro-slide-panel">
      <p className="macro-slide-label">Today</p>
      <MacroGaugeRow
        remaining={progress.remaining}
        completed={progress.completed}
        target={progress.target}
        percent={progress.percent}
      />
      <MacroTrackerRow counts={progress.counts} targets={progress.targets} />
    </div>
  );
}
