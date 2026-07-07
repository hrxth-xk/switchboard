"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download } from "lucide-react";
import type { Application } from "@prisma/client";
import { EntrySheet } from "@/components/quick-add/EntrySheet";
import { STATUS_LABELS, applicationStatusTone } from "@/lib/applications-utils";
import { formatResumeUploadedAt } from "@/lib/resume-utils";
import { formatShortDate } from "@/lib/problem-utils";

type ApplicationDetailViewProps = {
  application: Application;
};

export function ApplicationDetailView({ application }: ApplicationDetailViewProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function deleteApplication() {
    if (!window.confirm(`Delete ${application.company} application?`)) return;

    setLoading(true);
    setError("");
    const response = await fetch(`/api/applications/${application.id}`, { method: "DELETE" });
    setLoading(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Could not delete application." }));
      setError(body.error);
      return;
    }
    router.push("/dashboard/applications");
    router.refresh();
  }

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
          {error ? <div className="error wide">{error}</div> : null}

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
            {application.resumeFileName ? (
              <div className="detail-resume-card">
                <div>
                  <p className="detail-resume-title">Resume Attached</p>
                  <p className="detail-resume-file">{application.resumeFileName}</p>
                  {application.resumeUploadedAt ? (
                    <p className="detail-resume-meta">Uploaded {formatResumeUploadedAt(application.resumeUploadedAt)}</p>
                  ) : null}
                </div>
                <a className="button secondary compact" href={`/api/applications/${application.id}/resume`}>
                  <Download size={16} />
                  Download Resume
                </a>
              </div>
            ) : (
              <p className="detail-notes-body">No resume attached.</p>
            )}
          </div>

          <div className="detail-actions">
            <button className="button" disabled={loading} onClick={() => setEditing(true)} type="button">
              Edit Application
            </button>
            <button className="button danger" disabled={loading} onClick={deleteApplication} type="button">
              Delete Application
            </button>
          </div>
        </div>
      </div>

      <EntrySheet
        editTarget={editing ? { type: "application", data: application } : null}
        open={editing}
        onClose={() => setEditing(false)}
      />
    </>
  );
}
