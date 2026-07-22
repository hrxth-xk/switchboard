import type { Problem } from "@prisma/client";
import {
  calendarDayKey,
  compareCalendarDays,
  detectTimeZone,
  diffCalendarDays
} from "@/lib/period-utils";

export type ProblemRow = {
  id: string;
  name: string;
  url: string | null;
  slug: string | null;
  topic: string;
  pattern: string | null;
  difficulty: string | null;
  confidence: number | null;
  notes: string | null;
  lastPracticed: string;
  nextReview: string | null;
  revisitCount: number;
};

type ReviewableProblem = {
  nextReview: Date | string | null;
  name?: string;
};

export const CONFIDENCE_LABELS: Record<number, string> = {
  5: "Solved alone quickly",
  4: "Solved alone slowly",
  3: "Needed small hints",
  2: "Needed major hints",
  1: "Watched solution"
};

export function formatConfidence(confidence: number | null | undefined) {
  if (confidence == null) return "Unknown";
  return `${confidence}/5 · ${CONFIDENCE_LABELS[confidence] ?? "Unknown"}`;
}

function asDate(value: Date | string) {
  return typeof value === "string" ? new Date(value) : value;
}

export function serializeProblem(problem: Problem): ProblemRow {
  return {
    id: problem.id,
    name: problem.name,
    url: problem.url,
    slug: problem.slug,
    topic: problem.topic,
    pattern: problem.pattern,
    difficulty: problem.difficulty,
    confidence: problem.confidence,
    notes: problem.notes,
    lastPracticed: problem.lastPracticed.toISOString(),
    nextReview: problem.nextReview?.toISOString() ?? null,
    revisitCount: problem.revisitCount
  };
}

export function normalizeProblemName(name: string) {
  return name.trim();
}

/** Review is due if its calendar day is today or earlier in the given timezone. */
export function isReviewDue(
  problem: ReviewableProblem,
  now = new Date(),
  timeZone: string = detectTimeZone()
) {
  if (!problem.nextReview) return false;
  return compareCalendarDays(asDate(problem.nextReview), now, timeZone) <= 0;
}

export function getReviewQueue<T extends ReviewableProblem>(
  problems: T[],
  now = new Date(),
  timeZone: string = detectTimeZone()
) {
  return problems
    .filter((problem) => isReviewDue(problem, now, timeZone))
    .sort(
      (left, right) => asDate(left.nextReview!).getTime() - asDate(right.nextReview!).getTime()
    );
}

export function getProblemStats(problems: Problem[], now = new Date(), timeZone: string = detectTimeZone()) {
  const patterns = new Set(problems.map((problem) => problem.pattern).filter(Boolean));
  const rated = problems.filter((problem) => problem.confidence != null);

  return {
    total: problems.length,
    reviewDue: getReviewQueue(problems, now, timeZone).length,
    avgConfidence: rated.length
      ? Math.round(
          (rated.reduce((sum, problem) => sum + (problem.confidence ?? 0), 0) / rated.length) * 10
        ) / 10
      : 0,
    patternsCovered: patterns.size
  };
}

export function getAllProblemsSorted(problems: Problem[]) {
  return [...problems].sort((left, right) => right.lastPracticed.getTime() - left.lastPracticed.getTime());
}

export function formatShortDate(value: string | Date, timeZone: string = detectTimeZone()) {
  const date = asDate(value);
  return new Intl.DateTimeFormat("en", {
    timeZone,
    month: "short",
    day: "numeric"
  }).format(date);
}

export function formatReviewDueLabel(
  value: string | Date,
  now = new Date(),
  timeZone: string = detectTimeZone()
) {
  const date = asDate(value);
  const diffDays = diffCalendarDays(date, now, timeZone);

  if (diffDays < 0) return formatShortDate(date, timeZone);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return formatShortDate(date, timeZone);
}

export type ReviewDueGroupKey = "overdue" | "today" | "tomorrow" | "later";

export type ReviewDueGroup<T extends ReviewableProblem = Problem> = {
  key: ReviewDueGroupKey;
  label: string;
  problems: T[];
};

/**
 * All scheduled reviews ordered by urgency: overdue → today → tomorrow → future.
 * Overdue items keep appearing until completed.
 */
export function getReviewsDue<T extends ReviewableProblem>(
  problems: T[],
  now = new Date(),
  timeZone: string = detectTimeZone()
): ReviewDueGroup<T>[] {
  const scheduled = problems
    .filter((problem) => problem.nextReview)
    .sort(
      (left, right) => asDate(left.nextReview!).getTime() - asDate(right.nextReview!).getTime()
    );

  const buckets: Record<ReviewDueGroupKey, T[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    later: []
  };

  for (const problem of scheduled) {
    const diffDays = diffCalendarDays(asDate(problem.nextReview!), now, timeZone);

    if (diffDays < 0) buckets.overdue.push(problem);
    else if (diffDays === 0) buckets.today.push(problem);
    else if (diffDays === 1) buckets.tomorrow.push(problem);
    else buckets.later.push(problem);
  }

  const groups: ReviewDueGroup<T>[] = [];

  if (buckets.overdue.length) {
    groups.push({ key: "overdue", label: "Overdue", problems: buckets.overdue });
  }
  if (buckets.today.length) {
    groups.push({ key: "today", label: "Today", problems: buckets.today });
  }
  if (buckets.tomorrow.length) {
    groups.push({ key: "tomorrow", label: "Tomorrow", problems: buckets.tomorrow });
  }

  for (const problem of buckets.later) {
    const label = formatShortDate(problem.nextReview!, timeZone).toUpperCase();
    const existing = groups.find((group) => group.key === "later" && group.label === label);
    if (existing) {
      existing.problems.push(problem);
    } else {
      groups.push({ key: "later", label, problems: [problem] });
    }
  }

  return groups;
}

/** @deprecated Use getReviewsDue — kept for any remaining imports. */
export function getUpcomingRevisits(problems: Problem[], now = new Date(), timeZone?: string) {
  return getReviewsDue(problems, now, timeZone).flatMap((group) => group.problems);
}

export type DsaTodayProgress = {
  solvedToday: number;
  solvedGoal: number;
  revisitsCompletedToday: number;
  revisitsDueToday: number;
};

export function getDsaTodayProgress(
  problems: Array<ReviewableProblem & { name: string }>,
  activities: { label: string; createdAt: Date | string }[],
  dailyGoal: number,
  now = new Date(),
  timeZone: string = detectTimeZone()
): DsaTodayProgress {
  const todayKey = calendarDayKey(now, timeZone);
  const problemNames = new Set(problems.map((problem) => problem.name));

  const solvedToday = activities.filter((activity) => {
    if (!activity.label.startsWith("Solved ")) return false;
    if (!problemNames.has(activity.label.slice("Solved ".length))) return false;
    return calendarDayKey(asDate(activity.createdAt), timeZone) === todayKey;
  }).length;

  const revisitsCompletedToday = activities.filter((activity) => {
    if (!activity.label.startsWith("Revisited ")) return false;
    if (!problemNames.has(activity.label.slice("Revisited ".length))) return false;
    return calendarDayKey(asDate(activity.createdAt), timeZone) === todayKey;
  }).length;

  return {
    solvedToday,
    solvedGoal: dailyGoal,
    revisitsCompletedToday,
    revisitsDueToday: getReviewQueue(problems, now, timeZone).length
  };
}

export function problemNextAction(problem: Problem, now = new Date(), timeZone?: string) {
  if (isReviewDue(problem, now, timeZone)) {
    return `Review ${problem.name}`;
  }

  return `Practice ${problem.name}`;
}
