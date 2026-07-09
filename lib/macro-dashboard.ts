import type { ActionCardsData } from "@/lib/action-dashboard";
import { buildActionCards } from "@/lib/action-dashboard";
import type { UserGoalsData } from "@/lib/goals";
import { DEFAULT_GOALS } from "@/lib/goals";
import { startOfDay, startOfMonth } from "@/lib/period-utils";
import { buildDashboardProgress, type DashboardProgress } from "@/lib/progress-metrics";
import { prisma } from "@/lib/db";

export type MacroDashboardData = {
  goals: UserGoalsData | null;
  progress: DashboardProgress;
  actionCards: ActionCardsData;
};

export async function buildMacroDashboard(userId: string, now = new Date()): Promise<MacroDashboardData> {
  const monthStart = startOfMonth(now);
  const dayStart = startOfDay(now);

  const [goals, activities, problems, applications, projects] = await Promise.all([
    prisma.userGoals.findUnique({ where: { userId } }),
    prisma.activity.findMany({
      where: { userId, createdAt: { gte: monthStart } },
      select: { label: true, createdAt: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.problem.findMany({ where: { userId } }),
    prisma.application.findMany({ where: { userId } }),
    prisma.project.findMany({ where: { userId } })
  ]);

  const goalsData = goals ?? null;
  const effectiveGoals = goalsData ?? DEFAULT_GOALS;
  const todayActivities = activities.filter((activity) => activity.createdAt >= dayStart);

  return {
    goals: goalsData,
    progress: buildDashboardProgress(activities, effectiveGoals, now),
    actionCards: buildActionCards(todayActivities, problems, applications, projects, goalsData, now)
  };
}
