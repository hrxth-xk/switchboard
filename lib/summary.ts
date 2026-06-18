import type { Application, Goal, Topic } from "@prisma/client";

export function percent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

export function buildSummary(topics: Topic[], applications: Application[], goals: Goal[]) {
  const solved = topics.reduce((sum, topic) => sum + topic.solvedCount, 0);
  const target = topics.reduce((sum, topic) => sum + topic.targetCount, 0);
  const mastered = topics.filter((topic) => topic.status === "MASTERED").length;
  const activeApplications = applications.filter((application) =>
    ["APPLIED", "OA", "INTERVIEWING"].includes(application.status)
  ).length;
  const goalProgress = goals.length
    ? Math.round(goals.reduce((sum, goal) => sum + percent(goal.current, goal.target), 0) / goals.length)
    : 0;

  return {
    solved,
    target,
    mastered,
    activeApplications,
    goalProgress,
    dsaProgress: percent(solved, target)
  };
}
