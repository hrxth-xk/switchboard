"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import type { Application, ResumeVersion } from "@prisma/client";
import { EntrySheet } from "@/components/quick-add/EntrySheet";
import { ActionButtonContent } from "@/components/ui/ActionButtonContent";
import { STATUS_LABELS, applicationStatusTone } from "@/lib/applications-utils";
import { resumeVersionLabel } from "@/lib/resume-library";
import { formatResumeUploadedAt } from "@/lib/resume-utils";
import { formatShortDate } from "@/lib/problem-utils";
import { toastSuccess } from "@/lib/toast";
import { useConfirm } from "@/hooks/useConfirm";
import { usePendingAction } from "@/hooks/usePendingAction";

type ApplicationDetailViewProps = {
  application: Application & {
    resumeVersion: Pick<ResumeVersion, "id" | "name" | "version" | "originalFileName" | "createdAt"> | null;
  };
};

export function ApplicationDetailView({ application }: ApplicationDetailViewProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const { run, isPending, isBusy } = usePendingAction<"delete">();
  const { confirm, confirmDialog } = useConfirm();
  const [error, setError] = useState("");

  async function deleteApplication() {
    const confirmed = await confirm({
      title: `Delete ${application.company} application?`,
      description: "This can't be undone.",
      confirmLabel: "Delete"
    });
    if (!confirmed) return;

    setError("");
    await run("delete", async () => {
      const response = await fetch(`/api/applications/${application.id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Could not delete application." }));
        setError(body.error);
        return;
      }
      toastSuccess("Deleted");
      router.push("/dashboard/applications");
      router.refresh();
    });
  }

  const deleting = isPending("delete");
  const resume = application.resumeVersion;

  return (
    <>
      <div className="workspace-page">
        <header className="page-header page-header-back">
          <Link className="back-link" href="/dashboard/applications">
            ← Applications
          </Link>
          <h1 className="page-title">{application.company}</h1>
          <p className="page-kicker">{application.role}</p>
        </header>

        <div className="detail-panel">
          {error ? (
            <div className="error wide" role="alert">
              {error}
            </div>
          ) : null}

          <dl className="detail-grid">
            <div>
              <dt>Company</dt>
              <dd>{application.company}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{application.role}</dd>
            </div>
            <div>
              <dt>Job ID</dt>
              <dd>{application.jobId ?? "—"}</dd>
            </div>
            <div>
              <dt>Application URL</dt>
              <dd>
                {application.jobUrl ? (
                  <a href={application.jobUrl} rel="noreferrer" target="_blank">
                    Open posting
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt>Current Stage</dt>
              <dd className={`tone-${applicationStatusTone(application.status)}`}>
                {STATUS_LABELS[application.status as keyof typeof STATUS_LABELS]}
              </dd>
            </div>
            <div>
              <dt>Date Added</dt>
              <dd>{formatShortDate(application.updatedAt)}</dd>
            </div>
            <div>
              <dt>Date Applied</dt>
              <dd>{application.appliedAt ? formatShortDate(application.appliedAt) : "—"}</dd>
            </div>
          </dl>

          <div className="detail-notes">
            <p className="detail-notes-label">Notes</p>
            <p className="detail-notes-body">{application.notes?.trim() || "No notes yet."}</p>
          </div>

          <div className="detail-notes">
            <p className="detail-notes-label">Interview Notes</p>
            <p className="detail-notes-body">{application.nextAction?.trim() || "No interview notes yet."}</p>
          </div>

          <div className="detail-resume">
            <p className="detail-notes-label">Resume</p>
            {resume ? (
              <div className="detail-resume-card">
                <div>
                  <p className="detail-resume-title">{resumeVersionLabel(resume)}</p>
                  <p className="detail-resume-file">{resume.originalFileName}</p>
                  {resume.createdAt ? (
                    <p className="detail-resume-meta">Uploaded {formatResumeUploadedAt(resume.createdAt)}</p>
                  ) : null}
                </div>
                <div className="detail-resume-actions">
                  <a className="button secondary compact" href={`/api/resumes/${resume.id}/download`}>
                    <Download size={16} />
                    Download
                  </a>
                  <a
                    className="button secondary compact"
                    href={`/api/resumes/${resume.id}/download`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ExternalLink size={16} />
                    Open
                  </a>
                </div>
              </div>
            ) : (
              <p className="detail-notes-body">No resume linked.</p>
            )}
          </div>

          <div className="detail-actions">
            <button className="button" disabled={isBusy} onClick={() => setEditing(true)} type="button">
              Edit Application
            </button>
            <button
              className={`button danger${deleting ? " is-pending" : ""}`}
              disabled={isBusy}
              onClick={deleteApplication}
              type="button"
            >
              <ActionButtonContent pending={deleting} pendingLabel="Deleting…">
                Delete Application
              </ActionButtonContent>
            </button>
          </div>
        </div>
      </div>

      <EntrySheet
        editTarget={editing ? { type: "application", data: application } : null}
        open={editing}
        onClose={() => setEditing(false)}
      />

      {confirmDialog}
    </>
  );
}
