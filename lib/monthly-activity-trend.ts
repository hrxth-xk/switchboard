import type { Application, Problem, Project } from "@prisma/client";
import type { UserGoalsData } from "@/lib/goals";
import { endOfDay, startOfDay } from "@/lib/period-utils";

export type ActivityTrendDay = {
  actions: number;
  isToday: boolean;
};

export type MonthlyActivityTrend = {
  days: ActivityTrendDay[];
  dailyTarget: number;
};

/** Height % where the daily target line sits from the chart bottom. */
export const TARGET_LINE_PERCENT = 68;

function countDsaForDay(problems: Problem[], day: Date) {
  const start = startOfDay(day);
  const end = endOfDay(day);

  return problems.filter(
    (problem) => problem.lastPracticed >= start && problem.lastPracticed <= end
  ).length;
}

function countApplicationsForDay(applications: Application[], day: Date) {
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

function countProjectsForDay(projects: Project[], day: Date) {
  const start = startOfDay(day);
  const end = endOfDay(day);

  return projects.filter((project) => project.updatedAt >= start && project.updatedAt <= end).length;
}

export function dailyActionTarget(goals: UserGoalsData) {
  return goals.dailyDsaGoal + goals.dailyApplicationsGoal + goals.dailyProjectSessionsGoal;
}

export function activityBarHeightPercent(actions: number, dailyTarget: number) {
  if (actions <= 0 || dailyTarget <= 0) return 0;
  return Math.min((actions / dailyTarget) * TARGET_LINE_PERCENT, 100);
}

export function buildMonthlyActivityTrend(
  problems: Problem[],
  applications: Application[],
  projects: Project[],
  goals: UserGoalsData,
  now = new Date()
): MonthlyActivityTrend {
  const todayStart = startOfDay(now);
  const dailyTarget = dailyActionTarget(goals);

  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(todayStart);
    date.setDate(todayStart.getDate() - (29 - index));

    const actions =
      countDsaForDay(problems, date) +
      countApplicationsForDay(applications, date) +
      countProjectsForDay(projects, date);

    return {
      actions,
      isToday: startOfDay(date).getTime() === todayStart.getTime()
    };
  });

  return { days, dailyTarget };
}
