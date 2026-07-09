"use client";

import { WeeklyConsistencyGrid } from "@/components/dashboard/macro/WeeklyConsistencyGrid";
import type { WeeklyDayBreakdown } from "@/lib/weekly-breakdown";

type WeeklyPageProps = {
  days: WeeklyDayBreakdown[];
};

export function WeeklyPage({ days }: WeeklyPageProps) {
  return (
    <div className="macro-panel macro-slide-panel weekly-slide">
      <p className="macro-slide-label">This week</p>
      <WeeklyConsistencyGrid days={days} />
    </div>
  );
}
