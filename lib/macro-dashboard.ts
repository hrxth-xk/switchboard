import type { ActionCardMetrics } from "@/lib/action-dashboard";
import { buildActionCards } from "@/lib/action-dashboard";
import type { UserGoalsData } from "@/lib/goals";
import { DEFAULT_GOALS } from "@/lib/goals";
import {
  calendarDayKey,
  compareCalendarDays,
  detectTimeZone,
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek
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

function trendWindowStart(now: Date) {
  const start = startOfDay(now);
  start.setDate(start.getDate() - 29);
  return start;
}

export async function buildMacroDashboard(
  userId: string,
  now = new Date(),
  timeZone: string = detectTimeZone()
): Promise<MacroDashboardData> {
  const monthStart = startOfMonth(now);
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const monthEnd = endOfMonth(now);
  const trendStart = trendWindowStart(now);
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
    now
  );

  return {
    goals: goalsData,
    progress,
    actionCards: buildActionCards(todayActivities, metrics, goalsData, now),
    weeklyBreakdown: buildWeeklyBreakdown(trendProblems, trendApplications, trendProjects, effectiveGoals, now),
    activityTrend: buildMonthlyActivityTrend(trendProblems, trendApplications, trendProjects, effectiveGoals, now)
  };
}
