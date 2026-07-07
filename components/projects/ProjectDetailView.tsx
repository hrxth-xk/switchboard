"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Project } from "@prisma/client";
import { EntrySheet } from "@/components/quick-add/EntrySheet";
import { formatShortDate } from "@/lib/problem-utils";

type ProjectDetailViewProps = {
  project: Project;
};

export function ProjectDetailView({ project }: ProjectDetailViewProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runAction(action: "pause" | "resume" | "complete") {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    setLoading(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Could not update project." }));
      setError(body.error);
      return;
    }
    router.refresh();
  }

  async function deleteProject() {
    if (!window.confirm(`Delete ${project.title}?`)) return;

    setLoading(true);
    setError("");
    const response = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    setLoading(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Could not delete project." }));
      setError(body.error);
      return;
    }
    router.push("/dashboard/projects");
    router.refresh();
  }

  return (
    <>
      <div className="workspace-page">
        <header className="page-header page-header-back">
          <Link className="back-link" href="/dashboard/projects">
            ← Projects
          </Link>
          <h1 className="page-title">{project.title}</h1>
        </header>

        <div className="detail-panel">
          {error ? <div className="error wide">{error}</div> : null}

          <dl className="detail-grid">
            <div>
              <dt>Status</dt>
              <dd>{project.status.toLowerCase()}</dd>
            </div>
            <div>
              <dt>Priority</dt>
              <dd>{project.status === "ACTIVE" ? "High" : "Normal"}</dd>
            </div>
            <div>
              <dt>Created Date</dt>
              <dd>{formatShortDate(project.createdAt)}</dd>
            </div>
            <div>
              <dt>Last Updated</dt>
              <dd>{formatShortDate(project.updatedAt)}</dd>
            </div>
            <div className="detail-grid-wide">
              <dt>Next Step</dt>
              <dd>{project.nextStep ?? "No next step set"}</dd>
            </div>
          </dl>

          <div className="detail-notes">
            <p className="detail-notes-label">Notes</p>
            <p className="detail-notes-body">{project.notes?.trim() || "No notes yet."}</p>
          </div>

          <div className="detail-actions">
            <button className="button" disabled={loading} onClick={() => setEditing(true)} type="button">
              Edit Project
            </button>
            {project.status === "ACTIVE" ? (
              <button className="button secondary" disabled={loading} onClick={() => runAction("pause")} type="button">
                Pause Project
              </button>
            ) : null}
            {project.status === "PAUSED" ? (
              <button className="button secondary" disabled={loading} onClick={() => runAction("resume")} type="button">
                Resume Project
              </button>
            ) : null}
            {project.status !== "COMPLETED" ? (
              <button className="button secondary" disabled={loading} onClick={() => runAction("complete")} type="button">
                Complete Project
              </button>
            ) : null}
            <button className="button danger" disabled={loading} onClick={deleteProject} type="button">
              Delete Project
            </button>
          </div>
        </div>
      </div>

      <EntrySheet
        editTarget={editing ? { type: "project", data: project } : null}
        open={editing}
        onClose={() => setEditing(false)}
      />
    </>
  );
}
