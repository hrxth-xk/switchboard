import type { Application, Goal, Interview, Note, Topic } from "@prisma/client";
import { percent } from "@/lib/summary";

const APPLICATION_PRIORITY: Record<string, number> = {
  INTERVIEWING: 0,
  OA: 1,
  APPLIED: 2,
  WISHLIST: 3,
  REJECTED: 4,
  OFFER: 5
};

export type FocusInterview = Pick<Interview, "company" | "round" | "scheduledAt">;
export type FocusApplication = Pick<Application, "company" | "nextStep" | "status">;
export type FocusGoal = Pick<Goal, "title" | "current" | "target" | "metric" | "dueDate">;
export type FocusTopic = Pick<Topic, "title" | "confidence" | "status" | "solvedCount" | "targetCount">;

export type TodaysFocusData = {
  interview: FocusInterview | null;
  application: FocusApplication | null;
  goal: FocusGoal | null;
  topic: FocusTopic | null;
};

export type ActivityEntry = {
  id: string;
  label: string;
  at: Date | null;
};

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

export function formatRelativeTime(date: Date, now = new Date()) {
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(date);
}

export function sortApplicationsByPriority(applications: Application[]) {
  return [...applications].sort((left, right) => {
    const leftPriority = APPLICATION_PRIORITY[left.status] ?? 99;
    const rightPriority = APPLICATION_PRIORITY[right.status] ?? 99;
    if (leftPriority !== rightPriority) return leftPriority - rightPriority;
    return left.company.localeCompare(right.company);
  });
}

export function buildTodaysFocus(
  topics: Topic[],
  applications: Application[],
  interviews: Interview[],
  goals: Goal[],
  now = new Date()
): TodaysFocusData {
  const upcoming = interviews
    .filter((interview) => interview.scheduledAt >= now)
    .sort((left, right) => left.scheduledAt.getTime() - right.scheduledAt.getTime());

  const prioritized = sortApplicationsByPriority(applications);
  const application =
    prioritized.find((item) => item.nextStep) ??
    prioritized.find((item) => ["INTERVIEWING", "OA", "APPLIED"].includes(item.status)) ??
    prioritized[0] ??
    null;

  const activeGoals = goals
    .filter((goal) => goal.current < goal.target)
    .sort((left, right) => left.dueDate.getTime() - right.dueDate.getTime());

  const learningTopics = topics.filter((topic) => topic.status === "LEARNING" || topic.status === "REVISING");
  const topicPool = learningTopics.length ? learningTopics : topics;
  const topic =
    [...topicPool].sort((left, right) => {
      if (left.confidence !== right.confidence) return left.confidence - right.confidence;
      return percent(left.solvedCount, left.targetCount) - percent(right.solvedCount, right.targetCount);
    })[0] ?? null;

  return {
    interview: upcoming[0] ?? null,
    application: application
      ? { company: application.company, nextStep: application.nextStep, status: application.status }
      : null,
    goal: activeGoals[0] ?? null,
    topic: topic
      ? {
          title: topic.title,
          confidence: topic.confidence,
          status: topic.status,
          solvedCount: topic.solvedCount,
          targetCount: topic.targetCount
        }
      : null
  };
}

export function buildRecentActivity(
  topics: Topic[],
  applications: Application[],
  interviews: Interview[],
  notes: Note[]
): ActivityEntry[] {
  const entries: ActivityEntry[] = [
    ...notes.map((note) => ({
      id: `note-${note.id}`,
      label: `Added ${note.title} notes`,
      at: note.createdAt
    })),
    ...topics.map((topic) => ({
      id: `topic-${topic.id}`,
      label: `Added ${topic.title} topic`,
      at: topic.lastTouched
    })),
    ...applications
      .filter((application) => application.appliedAt)
      .map((application) => ({
        id: `application-${application.id}`,
        label: `Applied to ${application.company}`,
        at: application.appliedAt
      })),
    ...interviews.map((interview) => ({
      id: `interview-${interview.id}`,
      label: `Scheduled ${interview.company} interview`,
      at: interview.scheduledAt
    }))
  ];

  return entries
    .sort((left, right) => {
      if (left.at && right.at) return right.at.getTime() - left.at.getTime();
      if (left.at) return -1;
      if (right.at) return 1;
      return 0;
    })
    .slice(0, 5);
}
