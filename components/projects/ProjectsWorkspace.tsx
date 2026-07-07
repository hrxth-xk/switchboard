"use client";

import { useMemo, useState } from "react";
import type { Project } from "@prisma/client";
import { ProjectListCard } from "@/components/projects/ProjectListCard";
import type { ProjectStatus } from "@/lib/projects-utils";

const TABS: { value: ProjectStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" }
];

type ProjectsWorkspaceProps = {
  projects: Project[];
  initialTab?: ProjectStatus;
};

export function ProjectsWorkspace({ projects, initialTab = "ACTIVE" }: ProjectsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<ProjectStatus>(initialTab);

  const filtered = useMemo(
    () => projects.filter((project) => project.status === activeTab),
    [activeTab, projects]
  );

  return (
    <div className="workspace-body">
      <div className="segmented-control" role="tablist" aria-label="Project status">
        {TABS.map((tab) => (
          <button
            className={`segmented-btn${activeTab === tab.value ? " active" : ""}`}
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            role="tab"
            type="button"
            aria-selected={activeTab === tab.value}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length ? (
        <ul className="entity-card-list">
          {filtered.map((project) => (
            <li key={project.id}>
              <ProjectListCard project={project} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-inline workspace-empty">
          Nothing {TABS.find((tab) => tab.value === activeTab)?.label.toLowerCase()} yet.
        </p>
      )}
    </div>
  );
}
