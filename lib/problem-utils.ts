import type { Problem } from "@prisma/client";

import { endOfDay } from "@/lib/review-schedule";
import { endOfDay as periodEndOfDay, isWithinRange, startOfDay } from "@/lib/period-utils";



export type ProblemRow = {

  id: string;

  name: string;

  url: string | null;

  topic: string;

  pattern: string | null;

  confidence: number;

  notes: string | null;

  lastPracticed: string;

  nextReview: string | null;

  revisitCount: number;

};



export const CONFIDENCE_LABELS: Record<number, string> = {

  5: "Solved alone quickly",

  4: "Solved alone slowly",

  3: "Needed small hints",

  2: "Needed major hints",

  1: "Watched solution"

};



export function serializeProblem(problem: Problem): ProblemRow {

  return {

    id: problem.id,

    name: problem.name,

    url: problem.url,

    topic: problem.topic,

    pattern: problem.pattern,

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



export function isReviewDue(problem: Problem, now = new Date()) {

  if (!problem.nextReview) return false;

  return problem.nextReview <= endOfDay(now);

}



export function getReviewQueue(problems: Problem[], now = new Date()) {

  return problems

    .filter((problem) => isReviewDue(problem, now))

    .sort((left, right) => left.nextReview!.getTime() - right.nextReview!.getTime());

}



export function getProblemStats(problems: Problem[], now = new Date()) {
  const patterns = new Set(problems.map((problem) => problem.pattern).filter(Boolean));

  return {
    total: problems.length,
    reviewDue: getReviewQueue(problems, now).length,
    avgConfidence: problems.length
      ? Math.round((problems.reduce((sum, problem) => sum + problem.confidence, 0) / problems.length) * 10) / 10
      : 0,
    patternsCovered: patterns.size
  };
}



export function getAllProblemsSorted(problems: Problem[]) {

  return [...problems].sort((left, right) => right.lastPracticed.getTime() - left.lastPracticed.getTime());

}



export function formatShortDate(value: string | Date) {

  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);

}



export function formatReviewDueLabel(value: string | Date, now = new Date()) {
  const date = typeof value === "string" ? new Date(value) : value;
  const today = startOfDay(now);
  const target = startOfDay(date);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return formatShortDate(date);
}

export function getUpcomingRevisits(problems: Problem[], now = new Date()) {
  const endToday = periodEndOfDay(now);

  return problems
    .filter((problem) => problem.nextReview && problem.nextReview > endToday)
    .sort((left, right) => left.nextReview!.getTime() - right.nextReview!.getTime());
}

export type DsaTodayProgress = {
  solvedToday: number;
  solvedGoal: number;
  revisitsCompletedToday: number;
  revisitsDueToday: number;
};

export function getDsaTodayProgress(
  problems: Problem[],
  activities: { label: string; createdAt: Date }[],
  dailyGoal: number,
  now = new Date()
): DsaTodayProgress {
  const dayStart = startOfDay(now);
  const dayEnd = periodEndOfDay(now);
  const problemNames = new Set(problems.map((problem) => problem.name));

  const solvedToday = activities.filter(
    (activity) =>
      activity.label.startsWith("Solved ") &&
      isWithinRange(activity.createdAt, dayStart, dayEnd) &&
      problemNames.has(activity.label.slice("Solved ".length))
  ).length;

  const revisitsCompletedToday = activities.filter(
    (activity) =>
      activity.label.startsWith("Revisited ") &&
      isWithinRange(activity.createdAt, dayStart, dayEnd) &&
      problemNames.has(activity.label.slice("Revisited ".length))
  ).length;

  return {
    solvedToday,
    solvedGoal: dailyGoal,
    revisitsCompletedToday,
    revisitsDueToday: getReviewQueue(problems, now).length
  };
}

export function problemNextAction(problem: Problem, now = new Date()) {

  if (isReviewDue(problem, now)) {

    return `Review ${problem.name}`;

  }

  return `Practice ${problem.name}`;

}


