"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Archive, Pencil, Upload } from "lucide-react";
import { ActionButtonContent } from "@/components/ui/ActionButtonContent";
import type { ResumeVersionRow } from "@/lib/resume-library";
import { toastError, toastSuccess } from "@/lib/toast";
import { usePendingAction } from "@/hooks/usePendingAction";

type ResumeLibraryProps = {
  resumes: ResumeVersionRow[];
};

type LibraryTab = "active" | "archived";

export function ResumeLibrary({ resumes: initial }: ResumeLibraryProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { run, isPending, isBusy } = usePendingAction<"upload" | string>();
  const [name, setName] = useState("");
  const [tab, setTab] = useState<LibraryTab>("active");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const active = initial.filter((resume) => !resume.archived);
  const archived = initial.filter((resume) => resume.archived);
  const visible = tab === "active" ? active : archived;

  async function upload(file: File) {
    await run("upload", async () => {
      const formData = new FormData();
      formData.append("file", file);
      if (name.trim()) formData.append("name", name.trim());

      const response = await fetch("/api/resumes", { method: "POST", body: formData });
      const body = await response.json().catch(() => ({ error: "Could not upload resume." }));
      if (!response.ok) {
        toastError(body.error ?? "Could not upload resume.");
        return;
      }

      setName("");
      if (fileRef.current) fileRef.current.value = "";
      setTab("active");
      toastSuccess("Resume uploaded");
      router.refresh();
    });
  }

  async function rename(id: string) {
    const next = renameValue.trim();
    if (!next) return;

    await run(`rename-${id}`, async () => {
      const response = await fetch(`/api/resumes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next })
      });
      const body = await response.json().catch(() => ({ error: "Could not rename resume." }));
      if (!response.ok) {
        toastError(body.error ?? "Could not rename resume.");
        return;
      }
      setRenamingId(null);
      toastSuccess("Resume renamed");
      router.refresh();
    });
  }

  async function setArchived(id: string, nextArchived: boolean) {
    await run(`archive-${id}`, async () => {
      const response = await fetch(`/api/resumes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: nextArchived })
      });
      const body = await response.json().catch(() => ({ error: "Could not update resume." }));
      if (!response.ok) {
        toastError(body.error ?? "Could not update resume.");
        return;
      }
      setTab(nextArchived ? "archived" : "active");
      toastSuccess(nextArchived ? "Moved to Archived" : "Restored to Active");
      router.refresh();
    });
  }

  return (
    <div className="resume-library">
      <div className="resume-library-tabs" role="tablist" aria-label="Resume library">
        <button
          aria-selected={tab === "active"}
          className={`resume-library-tab${tab === "active" ? " active" : ""}`}
          onClick={() => setTab("active")}
          role="tab"
          type="button"
        >
          Active
          <span className="resume-library-tab-count">{active.length}</span>
        </button>
        <button
          aria-selected={tab === "archived"}
          className={`resume-library-tab${tab === "archived" ? " active" : ""}`}
          onClick={() => setTab("archived")}
          role="tab"
          type="button"
        >
          Archived
          <span className="resume-library-tab-count">{archived.length}</span>
        </button>
      </div>

      {tab === "active" ? (
        <section className="resume-library-upload">
          <label className="field">
            <span>Resume name</span>
            <input
              onChange={(event) => setName(event.target.value)}
              placeholder="Backend Resume"
              type="text"
              value={name}
            />
          </label>
          <input
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
            ref={fileRef}
            type="file"
          />
          <button
            className={`button${isPending("upload") ? " is-saving" : ""}`}
            disabled={isBusy}
            onClick={() => fileRef.current?.click()}
            type="button"
          >
            <ActionButtonContent pending={isPending("upload")} pendingLabel="Uploading…">
              <Upload size={18} />
              Upload resume
            </ActionButtonContent>
          </button>
        </section>
      ) : null}

      {visible.length === 0 ? (
        <p className="empty-inline workspace-empty">
          {tab === "active"
            ? "No active resumes yet. Upload your first version here."
            : "No archived resumes. Archive a version from Active to move it here."}
        </p>
      ) : (
        <ul className="resume-library-list" role="tabpanel">
          {visible.map((resume) => (
            <li className={`resume-library-card${resume.archived ? " is-archived" : ""}`} key={resume.id}>
              {renamingId === resume.id ? (
                <form
                  className="resume-library-rename"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void rename(resume.id);
                  }}
                >
                  <input
                    autoFocus
                    onChange={(event) => setRenameValue(event.target.value)}
                    value={renameValue}
                  />
                  <button className="button compact" disabled={isBusy} type="submit">
                    Save
                  </button>
                  <button
                    className="button secondary compact"
                    onClick={() => setRenamingId(null)}
                    type="button"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <div className="resume-library-copy">
                    <p className="resume-library-name">{resume.name}</p>
                    <p className="resume-library-meta">
                      <span>v{resume.version}</span>
                      {resume.uploadedLabel ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Uploaded {resume.uploadedLabel}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="resume-library-actions">
                    <a className="button secondary compact" href={`/api/resumes/${resume.id}/download`}>
                      Download
                    </a>
                    {resume.archived ? (
                      <button
                        className="button secondary compact"
                        disabled={isBusy}
                        onClick={() => void setArchived(resume.id, false)}
                        type="button"
                      >
                        Restore
                      </button>
                    ) : (
                      <>
                        <button
                          aria-label="Rename resume"
                          className="icon-button secondary"
                          disabled={isBusy}
                          onClick={() => {
                            setRenamingId(resume.id);
                            setRenameValue(resume.name);
                          }}
                          type="button"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          aria-label="Archive resume"
                          className="icon-button secondary"
                          disabled={isBusy}
                          onClick={() => void setArchived(resume.id, true)}
                          type="button"
                        >
                          <Archive size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
