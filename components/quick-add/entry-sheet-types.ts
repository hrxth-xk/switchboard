import type { Application, Project, ResumeVersion } from "@prisma/client";
import type { ProblemRow } from "@/lib/problem-utils";

export type SheetMode = "problem" | "application" | "project" | "note";

export type ApplicationEditData = Application & {
  resumeVersion?: Pick<ResumeVersion, "id" | "name" | "version" | "originalFileName" | "createdAt"> | null;
};

export type EditTarget =
  | { type: "problem"; data: ProblemRow }
  | { type: "application"; data: ApplicationEditData }
  | { type: "project"; data: Project };

export function sheetModeFromEditTarget(target: EditTarget): SheetMode {
  return target.type;
}

export function topicPatternValue(topic: string, pattern: string | null) {
  if (pattern?.trim()) return `${topic} / ${pattern}`;
  return topic;
}
