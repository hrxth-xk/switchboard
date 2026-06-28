import type { Application, Problem, Project } from "@prisma/client";
import { applicationNextAction, sortApplicationsByPriority } from "@/lib/applications-utils";
import { getReviewQueue, problemNextAction } from "@/lib/problem-utils";
import { getActiveProjects, projectNextAction } from "@/lib/projects-utils";

export type QueueItem = {
  id: string;
  kind: "problem" | "application" | "project";
  action: string;
  source: string;
  priority: number;
};

function queuePriority(kind: QueueItem["kind"], rank: number) {
  const base = { problem: 100, application: 200, project: 300 }[kind];
  return base + rank;
}

export function buildTodaysQueue(
  problems: Problem[],
  applications: Application[],
  projects: Project[],
  now = new Date()
): QueueItem[] {
  const items: QueueItem[] = [];
  const seenActions = new Set<string>();

  function push(item: QueueItem) {
    const key = item.action.toLowerCase();
    if (seenActions.has(key)) return;
    seenActions.add(key);
    items.push(item);
  }

  getReviewQueue(problems, now).slice(0, 4).forEach((problem, index) => {
    push({
      id: `problem-review-${problem.id}`,
      kind: "problem",
      source: problem.topic,
      action: problemNextAction(problem, now),
      priority: queuePriority("problem", index)
    });
  });

  applications
    .filter((application) => application.status === "OA")
    .slice(0, 2)
    .forEach((application, index) => {
      push({
        id: `application-oa-${application.id}`,
        kind: "application",
        source: application.company,
        action: applicationNextAction(application),
        priority: queuePriority("application", index)
      });
    });

  sortApplicationsByPriority(
    applications.filter((application) => ["INTERVIEW", "APPLIED", "WISHLIST"].includes(application.status))
  )
    .slice(0, 3)
    .forEach((application, index) => {
      push({
        id: `application-${application.id}`,
        kind: "application",
        source: application.company,
        action: applicationNextAction(application),
        priority: queuePriority("application", 10 + index)
      });
    });

  getActiveProjects(projects)
    .slice(0, 2)
    .forEach((project, index) => {
      push({
        id: `project-${project.id}`,
        kind: "project",
        source: project.title,
        action: projectNextAction(project),
        priority: queuePriority("project", index)
      });
    });

  return items.sort((left, right) => left.priority - right.priority).slice(0, 8);
}
