import { ProjectSection } from "@/components/projects/ProjectSection";
import { requireUser } from "@/lib/auth";
import { projectsByStatus } from "@/lib/projects-utils";
import { prisma } from "@/lib/db";

export default async function ProjectsPage() {
  const user = await requireUser();

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <div className="workspace-page">
      <header className="page-header">
        <h1 className="page-title">Projects</h1>
        <p className="page-kicker">Lightweight work containers — no subtasks</p>
      </header>

      <ProjectSection
        title="Active projects"
        projects={projectsByStatus(projects, "ACTIVE")}
        emptyText="Nothing active"
      />
      <ProjectSection
        title="Paused projects"
        projects={projectsByStatus(projects, "PAUSED")}
        emptyText="Nothing paused"
      />
      <ProjectSection
        title="Completed projects"
        projects={projectsByStatus(projects, "COMPLETED")}
        emptyText="Nothing completed"
      />
    </div>
  );
}
