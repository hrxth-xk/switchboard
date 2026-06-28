import type { Application, Problem, Project } from "@prisma/client";
import {
  applicationNextAction,
  sortApplicationsByPriority,
  STATUS_LABELS,
  type ApplicationStatus
} from "@/lib/applications-utils";
import { getActiveProjects, projectNextAction } from "@/lib/projects-utils";
import { getReviewQueue, isReviewDue, formatShortDate } from "@/lib/problem-utils";

export type FocusItem = {
  kind: "problem" | "application" | "project";
  title: string;
  subtitle: string;
  href: string;
};

export type DsaSnapshot = {
  total: number;
  reviewDue: number;
  avgConfidence: number;
};

export type ApplicationSnapshot = {
  wishlist: number;
  applied: number;
  interviewing: number;
};

export type ProjectSnapshot = {
  active: number;
  paused: number;
  completed: number;
};

export type CommandCenterData = {
  focus: FocusItem[];
  dsa: DsaSnapshot;
  applications: ApplicationSnapshot;
  projects: ProjectSnapshot;
};

function pickFocusProblem(problems: Problem[], now = new Date()): FocusItem | null {
  const reviewQueue = getReviewQueue(problems, now);
  const problem =
    reviewQueue[0] ??
    [...problems].sort((left, right) => {
      if (left.confidence !== right.confidence) return left.confidence - right.confidence;
      return right.lastPracticed.getTime() - left.lastPracticed.getTime();
    })[0];

  if (!problem) return null;

  const due = isReviewDue(problem, now);
  const subtitle = due
    ? "Due today"
    : problem.nextReview
      ? `Review ${formatShortDate(problem.nextReview)}`
      : `${problem.topic} · confidence ${problem.confidence}`;

  return {
    kind: "problem",
    title: due ? `Review ${problem.name}` : `Practice ${problem.name}`,
    subtitle,
    href: "/dashboard/dsa"
  };
}

function pickFocusApplication(applications: Application[]): FocusItem | null {
  const application = sortApplicationsByPriority(applications)[0];
  if (!application) return null;

  return {
    kind: "application",
    title: applicationNextAction(application),
    subtitle: STATUS_LABELS[application.status as ApplicationStatus] ?? application.status,
    href: "/dashboard/applications"
  };
}

function pickFocusProject(projects: Project[]): FocusItem | null {
  const project = getActiveProjects(projects)[0];
  if (!project) return null;

  return {
    kind: "project",
    title: projectNextAction(project),
    subtitle: project.title,
    href: "/dashboard/projects"
  };
}

export function buildDsaSnapshot(problems: Problem[], now = new Date()): DsaSnapshot {
  const reviewDue = getReviewQueue(problems, now).length;
  const avgConfidence = problems.length
    ? Math.round((problems.reduce((sum, problem) => sum + problem.confidence, 0) / problems.length) * 10) / 10
    : 0;

  return {
    total: problems.length,
    reviewDue,
    avgConfidence
  };
}

export function buildApplicationSnapshot(applications: Application[]): ApplicationSnapshot {
  return {
    wishlist: applications.filter((application) => application.status === "WISHLIST").length,
    applied: applications.filter((application) => application.status === "APPLIED").length,
    interviewing: applications.filter((application) => application.status === "INTERVIEW").length
  };
}

export function buildProjectSnapshot(projects: Project[]): ProjectSnapshot {
  return {
    active: projects.filter((project) => project.status === "ACTIVE").length,
    paused: projects.filter((project) => project.status === "PAUSED").length,
    completed: projects.filter((project) => project.status === "COMPLETED").length
  };
}

export function buildCommandCenter(
  problems: Problem[],
  applications: Application[],
  projects: Project[],
  now = new Date()
): CommandCenterData {
  const focus = [
    pickFocusProblem(problems, now),
    pickFocusApplication(applications),
    pickFocusProject(projects)
  ].filter((item): item is FocusItem => item !== null);

  return {
    focus,
    dsa: buildDsaSnapshot(problems, now),
    applications: buildApplicationSnapshot(applications),
    projects: buildProjectSnapshot(projects)
  };
}
