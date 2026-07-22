"use client";

import { useMemo, useState } from "react";
import { FolderKanban } from "lucide-react";
import type { Project } from "@prisma/client";
import { ProjectListCard } from "@/components/projects/ProjectListCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { StaggerList } from "@/components/ui/StaggerList";
import { EntrySheet } from "@/components/quick-add/EntrySheet";
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
  const [quickAddOpen, setQuickAddOpen] = useState(false);

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
        <StaggerList
          className="entity-card-list"
          getKey={(project) => project.id}
          items={filtered}
          renderItem={(project) => <ProjectListCard project={project} />}
        />
      ) : (
        <EmptyState
          action={
            activeTab === "ACTIVE" ? (
              <button className="button" onClick={() => setQuickAddOpen(true)} type="button">
                Add a project
              </button>
            ) : undefined
          }
          description={
            activeTab === "ACTIVE"
              ? "Start tracking a portfolio project and its next step lives right here."
              : `Projects show up here once they're ${TABS.find((tab) => tab.value === activeTab)?.label.toLowerCase()}.`
          }
          icon={FolderKanban}
          title={`Nothing ${TABS.find((tab) => tab.value === activeTab)?.label.toLowerCase()} yet`}
        />
      )}

      <EntrySheet initialMode="project" onClose={() => setQuickAddOpen(false)} open={quickAddOpen} />
    </div>
  );
}
