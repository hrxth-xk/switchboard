"use client";

import Link from "next/link";
import type { Project } from "@prisma/client";

type ProjectListCardProps = {
  project: Project;
};

function previewNotes(notes: string | null) {
  if (!notes) return null;
  return notes.length > 96 ? `${notes.slice(0, 96)}…` : notes;
}

export function ProjectListCard({ project }: ProjectListCardProps) {
  const notesPreview = previewNotes(project.notes);

  return (
    <Link className="entity-card project-entity-card" href={`/dashboard/projects/${project.id}`} prefetch={false}>
      <div className="entity-card-top">
        <p className="entity-card-title">{project.title}</p>
        <span className={`entity-card-badge ${project.status === "ACTIVE" ? "tone-positive" : project.status === "PAUSED" ? "tone-attention" : ""}`.trim()}>
          {project.status.toLowerCase()}
        </span>
      </div>
      <p className="entity-card-line">
        <span className="entity-card-label-inline">Next</span> {project.nextStep ?? "No next step set"}
      </p>
      {notesPreview ? <p className="entity-card-line entity-card-note-preview">{notesPreview}</p> : null}
    </Link>
  );
}
