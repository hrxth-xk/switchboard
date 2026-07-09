"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Project } from "@prisma/client";
import { EntrySheet } from "@/components/quick-add/EntrySheet";
import { ActionButtonContent } from "@/components/ui/ActionButtonContent";
import { formatShortDate } from "@/lib/problem-utils";
import { usePendingAction } from "@/hooks/usePendingAction";

type ProjectDetailViewProps = {
  project: Project;
};

type ProjectAction = "pause" | "resume" | "complete" | "delete";

export function ProjectDetailView({ project }: ProjectDetailViewProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const { run, isPending, isBusy } = usePendingAction<ProjectAction>();
  const [error, setError] = useState("");

  async function runAction(action: "pause" | "resume" | "complete") {
    setError("");
    await run(action, async () => {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Could not update project." }));
        setError(body.error);
        return;
      }
      router.refresh();
    });
  }

  async function deleteProject() {
    if (!window.confirm(`Delete ${project.title}?`)) return;

    setError("");
    await run("delete", async () => {
      const response = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Could not delete project." }));
        setError(body.error);
        return;
      }
      router.push("/dashboard/projects");
      router.refresh();
    });
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
            <button className="button" disabled={isBusy} onClick={() => setEditing(true)} type="button">
              Edit Project
            </button>
            {project.status === "ACTIVE" ? (
              <button
                className={`button secondary${isPending("pause") ? " is-pending" : ""}`}
                disabled={isBusy}
                onClick={() => runAction("pause")}
                type="button"
              >
                <ActionButtonContent pending={isPending("pause")} pendingLabel="Saving…">
                  Pause Project
                </ActionButtonContent>
              </button>
            ) : null}
            {project.status === "PAUSED" ? (
              <button
                className={`button secondary${isPending("resume") ? " is-pending" : ""}`}
                disabled={isBusy}
                onClick={() => runAction("resume")}
                type="button"
              >
                <ActionButtonContent pending={isPending("resume")} pendingLabel="Saving…">
                  Resume Project
                </ActionButtonContent>
              </button>
            ) : null}
            {project.status !== "COMPLETED" ? (
              <button
                className={`button secondary${isPending("complete") ? " is-pending" : ""}`}
                disabled={isBusy}
                onClick={() => runAction("complete")}
                type="button"
              >
                <ActionButtonContent pending={isPending("complete")} pendingLabel="Saving…">
                  Complete Project
                </ActionButtonContent>
              </button>
            ) : null}
            <button
              className={`button danger${isPending("delete") ? " is-pending" : ""}`}
              disabled={isBusy}
              onClick={deleteProject}
              type="button"
            >
              <ActionButtonContent pending={isPending("delete")} pendingLabel="Deleting…">
                Delete Project
              </ActionButtonContent>
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
