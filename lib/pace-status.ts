import type { DashboardProgress, PeriodCounts, PeriodProgress } from "@/lib/progress-metrics";
import type { MetricKey } from "@/lib/progress-metrics";

const METRIC_ORDER: MetricKey[] = ["dsa", "applications", "projects"];

export function paceLabelForPeriod(percent: number, elapsedDays: number, totalDays: number) {
  const expected = totalDays > 0 ? Math.round((elapsedDays / totalDays) * 100) : 100;

  if (percent >= expected - 12) return "On Pace";
  if (percent >= expected - 30) return "Catching Up";
  return "Behind Pace";
}

export function monthlyCompletionPercent(monthly: DashboardProgress["monthly"]) {
  const percentages = METRIC_ORDER.map((key) => {
    const target = monthly.targets[key];
    if (target <= 0) return null;
    return Math.min(Math.round((monthly.counts[key] / target) * 100), 100);
  }).filter((value): value is number => value !== null);

  if (!percentages.length) return 0;
  return Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length);
}

export function categoryFillPercent(count: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(Math.round((count / target) * 100), 100);
}

export function formatCategoryProgress(counts: PeriodCounts, targets: PeriodCounts, key: MetricKey) {
  return `${counts[key]} / ${targets[key]}`;
}

export function weeklyCategoryRows(progress: PeriodProgress) {
  return METRIC_ORDER.map((key) => ({
    key,
    value: formatCategoryProgress(progress.counts, progress.targets, key)
  }));
}

export const PACE_METRIC_ORDER = METRIC_ORDER;
