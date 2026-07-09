import type { Application, Project } from "@prisma/client";
import type { ProblemRow } from "@/lib/problem-utils";

export type SheetMode = "problem" | "application" | "project" | "note";

export type EditTarget =
  | { type: "problem"; data: ProblemRow }
  | { type: "application"; data: Application }
  | { type: "project"; data: Project };

export function sheetModeFromEditTarget(target: EditTarget): SheetMode {
  return target.type;
}

export function topicPatternValue(topic: string, pattern: string | null) {
  if (pattern?.trim()) return `${topic} / ${pattern}`;
  return topic;
}
