import type { UserGoalsData } from "@/lib/goals";
import type { PeriodCounts } from "@/lib/progress-metrics";
import { endOfDay, startOfDay, startOfWeek } from "@/lib/period-utils";

type ProblemTrendRow = { lastPracticed: Date };
type ApplicationTrendRow = { appliedAt: Date | null; status: string };
type ProjectTrendRow = { updatedAt: Date };

export type WeeklyDayBreakdown = {
  shortLabel: string;
  dayNumber: number;
  isToday: boolean;
  isFuture: boolean;
  counts: PeriodCounts;
  targets: PeriodCounts;
};

function countDsaForDay(problems: ProblemTrendRow[], day: Date) {
  const start = startOfDay(day);
  const end = endOfDay(day);

  return problems.filter(
    (problem) => problem.lastPracticed >= start && problem.lastPracticed <= end
  ).length;
}

function countApplicationsForDay(applications: ApplicationTrendRow[], day: Date) {
  const start = startOfDay(day);
  const end = endOfDay(day);

  return applications.filter(
    (application) =>
      application.status !== "WISHLIST" &&
      application.appliedAt &&
      application.appliedAt >= start &&
      application.appliedAt <= end
  ).length;
}

function countProjectsForDay(projects: ProjectTrendRow[], day: Date) {
  const start = startOfDay(day);
  const end = endOfDay(day);

  return projects.filter((project) => project.updatedAt >= start && project.updatedAt <= end).length;
}

function dailyTargets(goals: UserGoalsData): PeriodCounts {
  return {
    dsa: goals.dailyDsaGoal,
    applications: goals.dailyApplicationsGoal,
    projects: goals.dailyProjectSessionsGoal
  };
}

export function buildWeeklyBreakdown(
  problems: ProblemTrendRow[],
  applications: ApplicationTrendRow[],
  projects: ProjectTrendRow[],
  goals: UserGoalsData,
  now = new Date()
): WeeklyDayBreakdown[] {
  const weekStart = startOfWeek(now);
  const todayStart = startOfDay(now);
  const targets = dailyTargets(goals);
  const shortLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const dayStart = startOfDay(date);

    return {
      shortLabel: shortLabels[index],
      dayNumber: date.getDate(),
      isToday: dayStart.getTime() === todayStart.getTime(),
      isFuture: dayStart.getTime() > todayStart.getTime(),
      counts: {
        dsa: countDsaForDay(problems, date),
        applications: countApplicationsForDay(applications, date),
        projects: countProjectsForDay(projects, date)
      },
      targets
    };
  });
}
