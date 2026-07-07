import { ProjectsWorkspace } from "@/components/projects/ProjectsWorkspace";
import { requireUser } from "@/lib/auth";
import type { ProjectStatus } from "@/lib/projects-utils";
import { prisma } from "@/lib/db";

type ProjectsPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

function tabFromParam(value?: string): ProjectStatus {
  if (value === "paused") return "PAUSED";
  if (value === "completed") return "COMPLETED";
  return "ACTIVE";
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const user = await requireUser();
  const { tab } = await searchParams;

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <div className="workspace-page">
      <header className="page-header">
        <h1 className="page-title">Projects</h1>
        <p className="page-kicker">What you should build next</p>
      </header>
      <ProjectsWorkspace initialTab={tabFromParam(tab)} projects={projects} />
    </div>
  );
}
