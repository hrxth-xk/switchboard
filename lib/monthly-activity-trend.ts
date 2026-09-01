import type { UserGoalsData } from "@/lib/goals";
import { calendarDayKey, detectTimeZone, shiftDayKey } from "@/lib/period-utils";

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

function countDsaForDay(problems: ProblemTrendRow[], dayKey: string, timeZone: string) {
  return problems.filter((problem) => calendarDayKey(problem.lastPracticed, timeZone) === dayKey)
    .length;
}

function countApplicationsForDay(
  applications: ApplicationTrendRow[],
  dayKey: string,
  timeZone: string
) {
  return applications.filter(
    (application) =>
      application.status !== "WISHLIST" &&
      application.appliedAt &&
      calendarDayKey(application.appliedAt, timeZone) === dayKey
  ).length;
}

function countProjectsForDay(projects: ProjectTrendRow[], dayKey: string, timeZone: string) {
  return projects.filter((project) => calendarDayKey(project.updatedAt, timeZone) === dayKey).length;
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
  now = new Date(),
  timeZone: string = detectTimeZone()
): MonthlyActivityTrend {
  const todayKey = calendarDayKey(now, timeZone);
  const dailyTarget = dailyActionTarget(goals);

  const days = Array.from({ length: 30 }, (_, index) => {
    const dayKey = shiftDayKey(todayKey, index - 29);

    const completionPercent = dayCompletionPercent(
      countDsaForDay(problems, dayKey, timeZone),
      countApplicationsForDay(applications, dayKey, timeZone),
      countProjectsForDay(projects, dayKey, timeZone),
      goals
    );

    return {
      completionPercent,
      isToday: dayKey === todayKey
    };
  });

  return { days, dailyTarget };
}
