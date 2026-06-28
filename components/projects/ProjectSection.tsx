"use client";

import { useState } from "react";
import type { Project } from "@prisma/client";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectEditor } from "@/components/projects/ProjectEditor";

type ProjectSectionProps = {
  title: string;
  projects: Project[];
  emptyText: string;
};

export function ProjectSection({ title, projects, emptyText }: ProjectSectionProps) {
  const [editing, setEditing] = useState<Project | null>(null);

  return (
    <>
      <section className="section-block">
        <header className="section-header">
          <h2 className="section-title">{title}</h2>
          <p className="section-kicker">{projects.length ? `${projects.length} total` : emptyText}</p>
        </header>

        {projects.length ? (
          <div className="project-grid">
            {projects.map((project) => (
              <ProjectCard key={project.id} onEdit={() => setEditing(project)} project={project} />
            ))}
          </div>
        ) : null}
      </section>

      {editing ? <ProjectEditor project={editing} onClose={() => setEditing(null)} /> : null}
    </>
  );
}
