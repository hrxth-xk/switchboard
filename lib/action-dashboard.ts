import type { UserGoalsData } from "@/lib/goals";
import { DEFAULT_GOALS } from "@/lib/goals";
import { calendarDayKey, detectTimeZone } from "@/lib/period-utils";

type ActivityRow = {
  label: string;
  createdAt: Date;
};

export type AccentTone = "positive" | "attention" | "neutral";

export type ActionCardMetrics = {
  reviewDue: number;
  applicationsTotal: number;
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

function countSolvedToday(activities: ActivityRow[], todayKey: string, timeZone: string) {
  return activities.filter(
    (activity) =>
      activity.label.startsWith("Solved ") &&
      calendarDayKey(activity.createdAt, timeZone) === todayKey
  ).length;
}

function countTodayActivities(activities: ActivityRow[], todayKey: string, timeZone: string) {
  return activities.filter((activity) => calendarDayKey(activity.createdAt, timeZone) === todayKey)
    .length;
}

export function buildActionCards(
  activities: ActivityRow[],
  metrics: ActionCardMetrics,
  goals: UserGoalsData | null,
  now = new Date(),
  timeZone: string = detectTimeZone()
): ActionCardsData {
  const effectiveGoals = goals ?? DEFAULT_GOALS;
  const todayKey = calendarDayKey(now, timeZone);
  const todayCount = countTodayActivities(activities, todayKey, timeZone);
  const { reviewDue, applicationsTotal, activeProjects } = metrics;
  const solvedToday = countSolvedToday(activities, todayKey, timeZone);
  const problemsLeft = Math.max(effectiveGoals.dailyDsaGoal - solvedToday, 0);

  const dsaMetric =
    reviewDue > 0
      ? `${reviewDue} revisit${reviewDue === 1 ? "" : "s"} due`
      : problemsLeft === 1
        ? "1 problem left today"
        : `${problemsLeft} problems left today`;

  const applicationLabel =
    applicationsTotal === 1 ? "1 application till date" : `${applicationsTotal} applications till date`;
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
      count: applicationsTotal,
      metric: applicationsTotal === 0 ? "No applications yet" : applicationLabel,
      tone: applicationsTotal > 0 ? "positive" : "neutral"
    },
    projects: {
      count: activeProjects,
      metric: activeProjects === 0 ? "No active projects" : projectLabel,
      tone: activeProjects > 0 ? "positive" : "neutral"
    }
  };
}
