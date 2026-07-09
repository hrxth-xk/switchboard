import type { UserGoalsData } from "@/lib/goals";
import { DEFAULT_GOALS } from "@/lib/goals";
import { endOfDay, isWithinRange, startOfDay } from "@/lib/period-utils";

type ActivityRow = {
  label: string;
  createdAt: Date;
};

export type AccentTone = "positive" | "attention" | "neutral";

export type ActionCardMetrics = {
  reviewDue: number;
  activeApplications: number;
  activeProjects: number;
};

export type ActionCardsData = {
  activity: {
    count: number;
    metric: string;
    tone: AccentTone;
  };
  dsa: {
    metric: string;
    tone: AccentTone;
  };
  applications: {
    count: number;
    metric: string;
    tone: AccentTone;
  };
  projects: {
    count: number;
    metric: string;
    tone: AccentTone;
  };
};

function countSolvedToday(activities: ActivityRow[], now: Date) {
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  return activities.filter(
    (activity) =>
      activity.label.startsWith("Solved ") && isWithinRange(activity.createdAt, dayStart, dayEnd)
  ).length;
}

function countTodayActivities(activities: ActivityRow[], now: Date) {
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  return activities.filter((activity) => isWithinRange(activity.createdAt, dayStart, dayEnd)).length;
}

export function buildActionCards(
  activities: ActivityRow[],
  metrics: ActionCardMetrics,
  goals: UserGoalsData | null,
  now = new Date()
): ActionCardsData {
  const effectiveGoals = goals ?? DEFAULT_GOALS;
  const todayCount = countTodayActivities(activities, now);
  const { reviewDue, activeApplications, activeProjects } = metrics;
  const solvedToday = countSolvedToday(activities, now);
  const problemsLeft = Math.max(effectiveGoals.dailyDsaGoal - solvedToday, 0);

  const dsaMetric =
    reviewDue > 0
      ? `${reviewDue} revisit${reviewDue === 1 ? "" : "s"} due`
      : problemsLeft === 1
        ? "1 problem left today"
        : `${problemsLeft} problems left today`;

  const applicationLabel =
    activeApplications === 1 ? "1 Application" : `${activeApplications} Applications`;
  const projectLabel =
    activeProjects === 1 ? "1 Active Project" : `${activeProjects} Active Projects`;

  return {
    activity: {
      count: todayCount,
      metric: todayCount === 0 ? "Nothing logged today" : `${todayCount} update${todayCount === 1 ? "" : "s"} today`,
      tone: todayCount > 0 ? "positive" : "neutral"
    },
    dsa: {
      metric: reviewDue === 0 && problemsLeft === 0 ? "Daily goal complete" : dsaMetric,
      tone: reviewDue > 0 || problemsLeft > 0 ? "attention" : "positive"
    },
    applications: {
      count: activeApplications,
      metric: activeApplications === 0 ? "No active applications" : applicationLabel,
      tone: activeApplications > 0 ? "positive" : "neutral"
    },
    projects: {
      count: activeProjects,
      metric: activeProjects === 0 ? "No active projects" : projectLabel,
      tone: activeProjects > 0 ? "positive" : "neutral"
    }
  };
}
