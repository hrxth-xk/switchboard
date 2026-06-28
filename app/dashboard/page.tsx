import { ExecutionDashboard } from "@/components/dashboard/ExecutionDashboard";
import { requireUser } from "@/lib/auth";
import { buildExecutionDashboard } from "@/lib/execution-utils";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const user = await requireUser();

  const [problems, applications, projects] = await Promise.all([
    prisma.problem.findMany({ where: { userId: user.id }, orderBy: { lastPracticed: "desc" } }),
    prisma.application.findMany({ where: { userId: user.id }, orderBy: [{ status: "asc" }, { company: "asc" }] }),
    prisma.project.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } })
  ]);

  const data = buildExecutionDashboard(problems, applications, projects, new Date());

  return <ExecutionDashboard data={data} />;
}
