"use client";

import { useMemo } from "react";
import { detectTimeZone } from "@/lib/period-utils";
import { getDsaTodayProgress, type ProblemRow } from "@/lib/problem-utils";

type ActivityRow = {
  label: string;
  createdAt: string;
};

type DsaTodayProgressProps = {
  problems: ProblemRow[];
  activities: ActivityRow[];
  dailyGoal: number;
};

export function DsaTodayProgressSection({ problems, activities, dailyGoal }: DsaTodayProgressProps) {
  const progress = useMemo(() => {
    const timeZone = detectTimeZone();
    return getDsaTodayProgress(problems, activities, dailyGoal, new Date(), timeZone);
  }, [activities, dailyGoal, problems]);

  return (
    <section className="workspace-section">
      <header className="workspace-section-header">
        <h2 className="workspace-section-title">Today&apos;s Progress</h2>
      </header>

      <div className="progress-pair-grid">
        <div className="progress-pair-card">
          <p className="progress-pair-label">Problems solved</p>
          <p className="progress-pair-value">
            {progress.solvedToday} / {progress.solvedGoal}
          </p>
        </div>
        <div className="progress-pair-card">
          <p className="progress-pair-label">Revisits</p>
          <p className="progress-pair-value">
            {progress.revisitsDueToday === 0
              ? "None due"
              : `${progress.revisitsCompletedToday} / ${progress.revisitsDueToday}`}
          </p>
        </div>
      </div>
    </section>
  );
}
