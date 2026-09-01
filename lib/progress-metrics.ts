import type { UserGoalsData } from "@/lib/goals";
import {
  detectTimeZone,
  zonedDaysElapsedInWeek,
  zonedDaysInMonth
} from "@/lib/period-utils";

export type MetricKey = "dsa" | "applications" | "projects";

export type PeriodCounts = Record<MetricKey, number>;

export type PeriodProgress = {
  counts: PeriodCounts;
  targets: PeriodCounts;
  completed: number;
  target: number;
  remaining: number;
  percent: number;
};

export type DashboardProgress = {
  daily: PeriodProgress;
  weekly: PeriodProgress;
  monthly: {
    counts: PeriodCounts;
    targets: PeriodCounts;
    differences: PeriodCounts;
  };
};

type ProgressCountsByPeriod = {
  daily: PeriodCounts;
  weekly: PeriodCounts;
  monthly: PeriodCounts;
};

function dailyTargets(goals: UserGoalsData): PeriodCounts {
  return {
    dsa: goals.dailyDsaGoal,
    applications: goals.dailyApplicationsGoal,
    projects: goals.dailyProjectSessionsGoal
  };
}

function sumCounts(counts: PeriodCounts) {
  return counts.dsa + counts.applications + counts.projects;
}

function capCountsByTargets(counts: PeriodCounts, targets: PeriodCounts): PeriodCounts {
  return {
    dsa: Math.min(counts.dsa, Math.max(targets.dsa, 0)),
    applications: Math.min(counts.applications, Math.max(targets.applications, 0)),
    projects: Math.min(counts.projects, Math.max(targets.projects, 0))
  };
}

function metricPercent(count: number, target: number) {
  if (target <= 0) return null;
  return Math.min(Math.round((count / target) * 100), 100);
}

export function buildPeriodProgress(counts: PeriodCounts, targets: PeriodCounts): PeriodProgress {
  const cappedCounts = capCountsByTargets(counts, targets);
  const completed = sumCounts(cappedCounts);
  const target = sumCounts(targets);
  const remaining = Math.max(target - completed, 0);
  const percentages = [
    metricPercent(counts.dsa, targets.dsa),
    metricPercent(counts.applications, targets.applications),
    metricPercent(counts.projects, targets.projects)
  ].filter((value): value is number => value !== null);
  const percent =
    percentages.length > 0
      ? Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length)
      : 0;

  return { counts, targets, completed, target, remaining, percent };
}

export function buildDashboardProgress(
  counts: ProgressCountsByPeriod,
  goals: UserGoalsData,
  now = new Date(),
  timeZone: string = detectTimeZone()
): DashboardProgress {
  const dailyCounts = counts.daily;
  const weeklyCounts = counts.weekly;
  const monthlyCounts = counts.monthly;

  const perDay = dailyTargets(goals);

  const daily = buildPeriodProgress(dailyCounts, perDay);

  const daysThisWeek = zonedDaysElapsedInWeek(now, timeZone);
  const weekly = buildPeriodProgress(weeklyCounts, {
    dsa: perDay.dsa * daysThisWeek,
    applications: perDay.applications * daysThisWeek,
    projects: perDay.projects * daysThisWeek
  });

  const daysThisMonth = zonedDaysInMonth(now, timeZone);
  const monthlyTargets: PeriodCounts = {
    dsa: perDay.dsa * daysThisMonth,
    applications: perDay.applications * daysThisMonth,
    projects: perDay.projects * daysThisMonth
  };

  const monthlyDifferences: PeriodCounts = {
    dsa: monthlyCounts.dsa - monthlyTargets.dsa,
    applications: monthlyCounts.applications - monthlyTargets.applications,
    projects: monthlyCounts.projects - monthlyTargets.projects
  };

  return {
    daily,
    weekly,
    monthly: {
      counts: monthlyCounts,
      targets: monthlyTargets,
      differences: monthlyDifferences
    }
  };
}

export const METRIC_LABELS: Record<MetricKey, string> = {
  dsa: "DSA",
  applications: "Applications",
  projects: "Projects"
};

export const METRIC_HREFS: Record<MetricKey, string> = {
  dsa: "/dashboard/dsa",
  applications: "/dashboard/applications",
  projects: "/dashboard/projects"
};
