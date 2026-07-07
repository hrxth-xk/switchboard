import type { UserGoalsData } from "@/lib/goals";
import {
  daysElapsedInMonth,
  daysElapsedInWeek,
  daysInMonth,
  endOfDay,
  endOfMonth,
  endOfWeek,
  isWithinRange,
  startOfDay,
  startOfMonth,
  startOfWeek
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

type ActivityRow = {
  label: string;
  createdAt: Date;
};

function isDsaActivity(label: string) {
  return label.startsWith("Solved ");
}

function isApplicationActivity(label: string) {
  return label.startsWith("Applied to ") || label.endsWith(" to APPLIED");
}

function isProjectActivity(label: string) {
  return (
    label.startsWith("Started project ") ||
    label.startsWith("Updated project ") ||
    label.startsWith("Completed project ")
  );
}

function classifyActivity(label: string): MetricKey | null {
  if (isDsaActivity(label)) return "dsa";
  if (isApplicationActivity(label)) return "applications";
  if (isProjectActivity(label)) return "projects";
  return null;
}

function countInRange(activities: ActivityRow[], start: Date, end: Date) {
  const counts: PeriodCounts = { dsa: 0, applications: 0, projects: 0 };

  for (const activity of activities) {
    if (!isWithinRange(activity.createdAt, start, end)) continue;
    const key = classifyActivity(activity.label);
    if (key) counts[key] += 1;
  }

  return counts;
}

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

export function buildPeriodProgress(counts: PeriodCounts, targets: PeriodCounts): PeriodProgress {
  const completed = sumCounts(counts);
  const target = sumCounts(targets);
  const remaining = Math.max(target - completed, 0);
  const percent = target > 0 ? Math.min(Math.round((completed / target) * 100), 100) : 0;

  return { counts, targets, completed, target, remaining, percent };
}

export function buildDashboardProgress(
  activities: ActivityRow[],
  goals: UserGoalsData,
  now = new Date()
): DashboardProgress {
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const dailyCounts = countInRange(activities, dayStart, dayEnd);
  const weeklyCounts = countInRange(activities, weekStart, weekEnd);
  const monthlyCounts = countInRange(activities, monthStart, monthEnd);

  const perDay = dailyTargets(goals);

  const daily = buildPeriodProgress(dailyCounts, perDay);

  const weekly = buildPeriodProgress(weeklyCounts, {
    dsa: perDay.dsa * daysElapsedInWeek(now),
    applications: perDay.applications * daysElapsedInWeek(now),
    projects: perDay.projects * daysElapsedInWeek(now)
  });

  const monthlyTargets: PeriodCounts = {
    dsa: perDay.dsa * daysInMonth(now),
    applications: perDay.applications * daysInMonth(now),
    projects: perDay.projects * daysInMonth(now)
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
