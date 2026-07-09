"use client";

import type { DashboardProgress } from "@/lib/progress-metrics";
import { MonthlyActivityChart } from "@/components/dashboard/macro/MonthlyActivityChart";
import { MacroTrackerRow } from "@/components/dashboard/macro/MacroTrackerRow";
import type { MonthlyActivityTrend } from "@/lib/monthly-activity-trend";

type MonthlyPageProps = {
  monthly: DashboardProgress["monthly"];
  activityTrend: MonthlyActivityTrend;
};

export function MonthlyPage({ monthly, activityTrend }: MonthlyPageProps) {
  return (
    <div className="macro-panel macro-slide-panel monthly-slide">
      <p className="macro-slide-label">This month</p>

      <MonthlyActivityChart days={activityTrend.days} dailyTarget={activityTrend.dailyTarget} />

      <MacroTrackerRow counts={monthly.counts} targets={monthly.targets} />
    </div>
  );
}
