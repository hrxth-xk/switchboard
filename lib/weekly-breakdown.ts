import type { UserGoalsData } from "@/lib/goals";
import type { PeriodCounts } from "@/lib/progress-metrics";
import {
  calendarDayKey,
  dayNumberFromKey,
  detectTimeZone,
  shiftDayKey,
  zonedStartOfWeek
} from "@/lib/period-utils";

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
  now = new Date(),
  timeZone: string = detectTimeZone()
): WeeklyDayBreakdown[] {
  const weekStartKey = calendarDayKey(zonedStartOfWeek(now, timeZone), timeZone);
  const todayKey = calendarDayKey(now, timeZone);
  const targets = dailyTargets(goals);
  const shortLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return Array.from({ length: 7 }, (_, index) => {
    const dayKey = shiftDayKey(weekStartKey, index);

    return {
      shortLabel: shortLabels[index],
      dayNumber: dayNumberFromKey(dayKey),
      // Day keys are ISO-ordered, so string comparison is calendar comparison.
      isToday: dayKey === todayKey,
      isFuture: dayKey > todayKey,
      counts: {
        dsa: countDsaForDay(problems, dayKey, timeZone),
        applications: countApplicationsForDay(applications, dayKey, timeZone),
        projects: countProjectsForDay(projects, dayKey, timeZone)
      },
      targets
    };
  });
}
