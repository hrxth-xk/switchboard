"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, X } from "lucide-react";
import type { Application } from "@prisma/client";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/applications-utils";
import { formatResumeUploadedAt } from "@/lib/resume-utils";

type ApplicationEditorProps = {
  application: Application;
  onClose: () => void;
};

function formatDateInput(value: Date | string | null) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

export function ApplicationEditor({ application, onClose }: ApplicationEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [status, setStatus] = useState(application.status);
  const showResume = status !== "WISHLIST";

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  async function uploadResume(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`/api/applications/${application.id}/resume`, {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Could not upload resume." }));
      throw new Error(body.error);
    }
  }

  async function save(formData: FormData) {
    setLoading(true);
    setError("");

    try {
      if (resumeFile && showResume) {
        await uploadResume(resumeFile);
      }

      const payload = Object.fromEntries(formData.entries());
      const response = await fetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Could not save changes." }));
        setError(body.error);
        return;
      }

      onClose();
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Could not upload resume.");
    } finally {
      setLoading(false);
    }
  }

  const uploadedLabel = application.resumeUploadedAt
    ? formatResumeUploadedAt(application.resumeUploadedAt)
    : null;

  return (
    <div className="modal-overlay editor-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal editor-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-editor-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="editor-sheet-head">
          <div className="modal-header">
            <div>
              <h2 className="panel-title" id="application-editor-title">
                {application.company}
              </h2>
              <p className="panel-kicker">{application.role}</p>
            </div>
            <button className="icon-button secondary modal-close" type="button" aria-label="Close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <form action={save} className="form-grid editor-sheet-form">
          {error ? <div className="error wide">{error}</div> : null}

          <label className="field wide">
            <span>Status</span>
            <select name="status" value={status} onChange={(event) => setStatus(event.target.value)}>
              {APPLICATION_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {STATUS_LABELS[item]}
                </option>
              ))}
            </select>
          </label>

          <label className="field wide">
            <span>Next action</span>
            <input
              name="nextAction"
              defaultValue={application.nextAction ?? ""}
              placeholder="Finish OA, follow up..."
            />
          </label>

          <label className="field wide">
            <span>Notes</span>
            <textarea name="notes" defaultValue={application.notes ?? ""} />
          </label>

          {showResume ? (
            <div className="field wide resume-field">
              <span>Resume</span>
              {application.resumeFileName ? (
                <div className="resume-current">
                  <div>
                    <p className="resume-name">{application.resumeFileName}</p>
                    {uploadedLabel ? <p className="resume-meta">uploaded {uploadedLabel}</p> : null}
                  </div>
                  <a className="button secondary compact" href={`/api/applications/${application.id}/resume`}>
                    <Download size={16} />
                    Download
                  </a>
                </div>
              ) : (
                <p className="field-hint">No resume uploaded yet.</p>
              )}
              <input
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="resume-input"
                type="file"
                onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
              />
              {resumeFile ? <p className="field-hint">Ready to upload: {resumeFile.name}</p> : null}
            </div>
          ) : null}

          <label className="field">
            <span>Applied date</span>
            <input name="appliedAt" type="date" defaultValue={formatDateInput(application.appliedAt)} />
          </label>

          <label className="field">
            <span>Job ID</span>
            <input name="jobId" defaultValue={application.jobId ?? ""} />
          </label>

          <label className="field wide">
            <span>Location</span>
            <input name="location" defaultValue={application.location ?? ""} />
          </label>

          <details className="field wide advanced-fields">
            <summary>Company & role</summary>
            <div className="form-grid nested-grid">
              <label className="field wide">
                <span>Company</span>
                <input name="company" defaultValue={application.company} required />
              </label>
              <label className="field wide">
                <span>Role</span>
                <input name="role" defaultValue={application.role} required />
              </label>
              <label className="field wide">
                <span>Job URL</span>
                <input
                  name="jobUrl"
                  type="url"
                  defaultValue={application.jobUrl ?? ""}
                  placeholder="https://..."
                  inputMode="url"
                />
              </label>
            </div>
          </details>

          <button className="button wide editor-sheet-submit" disabled={loading} type="submit">
            {loading ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
