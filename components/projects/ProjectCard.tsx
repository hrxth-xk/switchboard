import type { Project } from "@prisma/client";

type ProjectCardProps = {
  project: Pick<Project, "id" | "title" | "status" | "nextStep" | "notes">;
  onEdit: () => void;
};

function previewNotes(notes: string | null) {
  if (!notes) return null;
  return notes.length > 96 ? `${notes.slice(0, 96)}…` : notes;
}

export function ProjectCard({ project, onEdit }: ProjectCardProps) {
  const notesPreview = previewNotes(project.notes);

  return (
    <button className="project-card" type="button" onClick={onEdit}>
      <div className="project-card-top">
        <p className="project-card-title">{project.title}</p>
        <span className="status-tag">{project.status.toLowerCase()}</span>
      </div>
      <p className="project-card-step">{project.nextStep ?? "No next step set"}</p>
      {notesPreview ? <p className="project-card-notes">{notesPreview}</p> : null}
    </button>
  );
}
