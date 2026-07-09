"use client";

import Link from "next/link";
import type { DashboardProgress } from "@/lib/progress-metrics";
import { METRIC_HREFS, METRIC_LABELS, type MetricKey } from "@/lib/progress-metrics";

const METRIC_ORDER: MetricKey[] = ["dsa", "applications", "projects"];

type MonthlyPageProps = {
  monthly: DashboardProgress["monthly"];
};

function formatDifference(value: number) {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

export function MonthlyPage({ monthly }: MonthlyPageProps) {
  return (
    <div className="macro-panel macro-slide-panel macro-slide-panel-monthly">
      <p className="macro-slide-label">This month</p>

      <div className="macro-monthly-table">
        <div className="macro-monthly-row macro-monthly-head">
          <span />
          <span>Target</span>
          <span>Actual</span>
          <span>Diff</span>
        </div>

        {METRIC_ORDER.map((key: MetricKey) => (
          <Link key={key} href={METRIC_HREFS[key]} className="macro-monthly-row">
            <span className="macro-monthly-label">{METRIC_LABELS[key]}</span>
            <span>{monthly.targets[key]}</span>
            <span>{monthly.counts[key]}</span>
            <span
              className={
                monthly.differences[key] >= 0 ? "macro-diff-positive" : "macro-diff-negative"
              }
            >
              {formatDifference(monthly.differences[key])}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
