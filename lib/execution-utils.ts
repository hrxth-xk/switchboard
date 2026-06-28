import type { CommandCenterData } from "@/lib/command-center";
import { buildCommandCenter } from "@/lib/command-center";
import type { Application, Problem, Project } from "@prisma/client";

export type ExecutionDashboardData = CommandCenterData;

export function buildExecutionDashboard(
  problems: Problem[],
  applications: Application[],
  projects: Project[],
  now = new Date()
): ExecutionDashboardData {
  return buildCommandCenter(problems, applications, projects, now);
}
