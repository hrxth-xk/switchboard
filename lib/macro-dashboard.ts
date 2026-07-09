import type { ActionCardsData } from "@/lib/action-dashboard";
import { buildActionCards } from "@/lib/action-dashboard";
import type { UserGoalsData } from "@/lib/goals";
import { DEFAULT_GOALS } from "@/lib/goals";
import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from "@/lib/period-utils";
import { buildDashboardProgress, type DashboardProgress } from "@/lib/progress-metrics";
import { buildMonthlyActivityTrend, type MonthlyActivityTrend } from "@/lib/monthly-activity-trend";
import { buildWeeklyBreakdown, type WeeklyDayBreakdown } from "@/lib/weekly-breakdown";
import { prisma } from "@/lib/db";

export type MacroDashboardData = {
  goals: UserGoalsData | null;
  progress: DashboardProgress;
  actionCards: ActionCardsData;
  weeklyBreakdown: WeeklyDayBreakdown[];
  activityTrend: MonthlyActivityTrend;
};

export async function buildMacroDashboard(userId: string, now = new Date()): Promise<MacroDashboardData> {
  const monthStart = startOfMonth(now);
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const monthEnd = endOfMonth(now);

  const [
    goals,
    activities,
    problems,
    applications,
    projects,
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
      where: { userId, createdAt: { gte: monthStart } },
      select: { label: true, createdAt: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.problem.findMany({ where: { userId } }),
    prisma.application.findMany({ where: { userId } }),
    prisma.project.findMany({ where: { userId } }),
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

  const goalsData = goals ?? null;
  const effectiveGoals = goalsData ?? DEFAULT_GOALS;
  const todayActivities = activities.filter((activity) => activity.createdAt >= dayStart);
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
    actionCards: buildActionCards(todayActivities, problems, applications, projects, goalsData, now),
    weeklyBreakdown: buildWeeklyBreakdown(problems, applications, projects, effectiveGoals, now),
    activityTrend: buildMonthlyActivityTrend(problems, applications, projects, effectiveGoals, now)
  };
}
