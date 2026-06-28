import type { Project } from "@prisma/client";

export type ProjectStatus = "ACTIVE" | "PAUSED" | "COMPLETED";

export type ProjectStats = {
  active: number;
  paused: number;
  completed: number;
};

export function sortProjects(projects: Project[]) {
  return [...projects].sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());
}

export function getProjectStats(projects: Project[]): ProjectStats {
  return {
    active: projects.filter((project) => project.status === "ACTIVE").length,
    paused: projects.filter((project) => project.status === "PAUSED").length,
    completed: projects.filter((project) => project.status === "COMPLETED").length
  };
}

export function getActiveProjects(projects: Project[]): Project[] {
  return sortProjects(projects.filter((project) => project.status === "ACTIVE" || project.status === "PAUSED"));
}

export function projectsByStatus(projects: Project[], status: ProjectStatus) {
  return sortProjects(projects.filter((project) => project.status === status));
}

export function projectNextAction(project: Project) {
  return project.nextStep ?? `Define the next step for ${project.title}`;
}
