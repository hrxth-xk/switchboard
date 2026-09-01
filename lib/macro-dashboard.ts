import type { ActionCardMetrics } from "@/lib/action-dashboard";
import { buildActionCards } from "@/lib/action-dashboard";
import type { UserGoalsData } from "@/lib/goals";
import { DEFAULT_GOALS } from "@/lib/goals";
import {
  addCalendarDays,
  calendarDayKey,
  compareCalendarDays,
  detectTimeZone,
  zonedEndOfDay,
  zonedEndOfMonth,
  zonedEndOfWeek,
  zonedStartOfDay,
  zonedStartOfMonth,
  zonedStartOfWeek
} from "@/lib/period-utils";
import { buildDashboardProgress, type DashboardProgress } from "@/lib/progress-metrics";
import { buildMonthlyActivityTrend, type MonthlyActivityTrend } from "@/lib/monthly-activity-trend";
import { buildWeeklyBreakdown, type WeeklyDayBreakdown } from "@/lib/weekly-breakdown";
import { prisma } from "@/lib/db";

export type MacroDashboardData = {
  goals: UserGoalsData | null;
  progress: DashboardProgress;
  actionCards: ReturnType<typeof buildActionCards>;
  weeklyBreakdown: WeeklyDayBreakdown[];
  activityTrend: MonthlyActivityTrend;
};

function trendWindowStart(now: Date, timeZone: string) {
  return zonedStartOfDay(addCalendarDays(now, -29, timeZone), timeZone);
}

export async function buildMacroDashboard(
  userId: string,
  now = new Date(),
  timeZone: string = detectTimeZone()
): Promise<MacroDashboardData> {
  // Every boundary below is the user's calendar day, not the server's. The
  // server runs in UTC, so runtime-local boundaries would file an IST user's
  // 05:00 entry under yesterday.
  const monthStart = zonedStartOfMonth(now, timeZone);
  const dayStart = zonedStartOfDay(now, timeZone);
  const dayEnd = zonedEndOfDay(now, timeZone);
  const weekStart = zonedStartOfWeek(now, timeZone);
  const weekEnd = zonedEndOfWeek(now, timeZone);
  const monthEnd = zonedEndOfMonth(now, timeZone);
  const trendStart = trendWindowStart(now, timeZone);
  const activitySince = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const todayKey = calendarDayKey(now, timeZone);

  const [
    goals,
    recentActivities,
    trendProblems,
    trendApplications,
    trendProjects,
    reviewCandidates,
    applicationsTotal,
    activeProjects,
    dailyDsa,
    weeklyDsa,
    monthlyDsa,
    dailyApplications,
    weeklyApplications,
    monthlyApplications,
    dailyProjects,
    weeklyProjects,
    monthlyProjects
  ] = await Promise.all([
    prisma.userGoals.findUnique({ where: { userId } }),
    prisma.activity.findMany({
      where: { userId, createdAt: { gte: activitySince } },
      select: { label: true, createdAt: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.problem.findMany({
      where: { userId, lastPracticed: { gte: trendStart } },
      select: { lastPracticed: true }
    }),
    prisma.application.findMany({
      where: { userId, appliedAt: { gte: trendStart } },
      select: { appliedAt: true, status: true }
    }),
    prisma.project.findMany({
      where: { userId, updatedAt: { gte: trendStart } },
      select: { updatedAt: true }
    }),
    prisma.problem.findMany({
      where: { userId, nextReview: { not: null } },
      select: { nextReview: true }
    }),
    prisma.application.count({
      where: { userId }
    }),
    prisma.project.count({
      where: { userId, status: "ACTIVE" }
    }),
    prisma.problem.count({ where: { userId, lastPracticed: { gte: dayStart, lte: dayEnd } } }),
    prisma.problem.count({ where: { userId, lastPracticed: { gte: weekStart, lte: weekEnd } } }),
    prisma.problem.count({ where: { userId, lastPracticed: { gte: monthStart, lte: monthEnd } } }),
    prisma.application.count({
      where: { userId, appliedAt: { gte: dayStart, lte: dayEnd }, status: { not: "WISHLIST" } }
    }),
    prisma.application.count({
      where: { userId, appliedAt: { gte: weekStart, lte: weekEnd }, status: { not: "WISHLIST" } }
    }),
    prisma.application.count({
      where: { userId, appliedAt: { gte: monthStart, lte: monthEnd }, status: { not: "WISHLIST" } }
    }),
    prisma.project.count({ where: { userId, updatedAt: { gte: dayStart, lte: dayEnd } } }),
    prisma.project.count({ where: { userId, updatedAt: { gte: weekStart, lte: weekEnd } } }),
    prisma.project.count({ where: { userId, updatedAt: { gte: monthStart, lte: monthEnd } } })
  ]);

  const todayActivities = recentActivities.filter(
    (activity) => calendarDayKey(activity.createdAt, timeZone) === todayKey
  );
  const reviewDue = reviewCandidates.filter(
    (problem) => problem.nextReview && compareCalendarDays(problem.nextReview, now, timeZone) <= 0
  ).length;

  const goalsData = goals ?? null;
  const effectiveGoals = goalsData ?? DEFAULT_GOALS;
  const metrics: ActionCardMetrics = {
    reviewDue,
    applicationsTotal,
    activeProjects
  };

  const progress = buildDashboardProgress(
    {
      daily: { dsa: dailyDsa, applications: dailyApplications, projects: dailyProjects },
      weekly: { dsa: weeklyDsa, applications: weeklyApplications, projects: weeklyProjects },
      monthly: { dsa: monthlyDsa, applications: monthlyApplications, projects: monthlyProjects }
    },
    effectiveGoals,
    now,
    timeZone
  );

  return {
    goals: goalsData,
    progress,
    actionCards: buildActionCards(todayActivities, metrics, goalsData, now, timeZone),
    weeklyBreakdown: buildWeeklyBreakdown(
      trendProblems,
      trendApplications,
      trendProjects,
      effectiveGoals,
      now,
      timeZone
    ),
    activityTrend: buildMonthlyActivityTrend(
      trendProblems,
      trendApplications,
      trendProjects,
      effectiveGoals,
      now,
      timeZone
    )
  };
}
