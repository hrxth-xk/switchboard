import type { UserGoalsData } from "@/lib/goals";
import { endOfDay, startOfDay } from "@/lib/period-utils";

type ProblemTrendRow = { lastPracticed: Date };
type ApplicationTrendRow = { appliedAt: Date | null; status: string };
type ProjectTrendRow = { updatedAt: Date };

export type ActivityTrendDay = {
  /** Overall day completion 0–100 from capped per-category percentages. */
  completionPercent: number;
  isToday: boolean;
};

export type MonthlyActivityTrend = {
  days: ActivityTrendDay[];
  dailyTarget: number;
};

/** Height % where the daily target line sits from the chart bottom. */
export const TARGET_LINE_PERCENT = 68;

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

export function dailyActionTarget(goals: UserGoalsData) {
  return goals.dailyDsaGoal + goals.dailyApplicationsGoal + goals.dailyProjectSessionsGoal;
}

/** Map a 0–100 completion score to bar height on the chart. */
export function activityBarHeightPercent(completionPercent: number) {
  if (completionPercent <= 0) return 0;
  return Math.min((completionPercent / 100) * TARGET_LINE_PERCENT, 100);
}

function dayCompletionPercent(
  dsa: number,
  applications: number,
  projects: number,
  goals: UserGoalsData
) {
  const categoryPercents: number[] = [];

  if (goals.dailyDsaGoal > 0) {
    categoryPercents.push(Math.min(dsa / goals.dailyDsaGoal, 1) * 100);
  }
  if (goals.dailyApplicationsGoal > 0) {
    categoryPercents.push(Math.min(applications / goals.dailyApplicationsGoal, 1) * 100);
  }
  if (goals.dailyProjectSessionsGoal > 0) {
    categoryPercents.push(Math.min(projects / goals.dailyProjectSessionsGoal, 1) * 100);
  }

  if (categoryPercents.length === 0) return 0;
  return Math.round(categoryPercents.reduce((sum, value) => sum + value, 0) / categoryPercents.length);
}

export function buildMonthlyActivityTrend(
  problems: ProblemTrendRow[],
  applications: ApplicationTrendRow[],
  projects: ProjectTrendRow[],
  goals: UserGoalsData,
  now = new Date()
): MonthlyActivityTrend {
  const todayStart = startOfDay(now);
  const dailyTarget = dailyActionTarget(goals);

  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(todayStart);
    date.setDate(todayStart.getDate() - (29 - index));

    const completionPercent = dayCompletionPercent(
      countDsaForDay(problems, date),
      countApplicationsForDay(applications, date),
      countProjectsForDay(projects, date),
      goals
    );

    return {
      completionPercent,
      isToday: startOfDay(date).getTime() === todayStart.getTime()
    };
  });

  return { days, dailyTarget };
}
