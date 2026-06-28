"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, FolderKanban, NotebookPen, Plus, X } from "lucide-react";
import { ReviewScheduleField } from "@/components/dsa/ReviewScheduleField";
import type { ReviewPreset } from "@/lib/review-schedule";

type Mode = "problem" | "application" | "project" | "note";

const modes: Array<{ id: Mode; label: string; short: string }> = [
  { id: "problem", label: "DSA Problem", short: "DSA" },
  { id: "application", label: "Application", short: "App" },
  { id: "project", label: "Project", short: "Project" },
  { id: "note", label: "Note", short: "Note" }
];

const ACTIVE_APPLICATION_STATUSES = new Set(["APPLIED", "OA", "INTERVIEW", "OFFER", "REJECTED"]);

export function QuickAddFab() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button className="fab" type="button" aria-label="Quick add" onClick={() => setOpen(true)}>
        <Plus size={22} />
      </button>

      {open ? (
        <div className="modal-overlay" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="modal quick-add-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-add-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="quick-add-head">
              <div className="modal-header">
                <div>
                  <h2 className="panel-title" id="quick-add-title">
                    Quick add
                  </h2>
                  <p className="panel-kicker">Capture progress while it is fresh.</p>
                </div>
                <button
                  className="icon-button secondary modal-close"
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <QuickAdd onClose={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}

function QuickAdd({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("problem");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviewSchedule, setReviewSchedule] = useState<{ reviewPreset?: ReviewPreset; customReviewDate?: string }>({
    reviewPreset: "oneWeek"
  });

  async function submit(formData: FormData) {
    setLoading(true);
    setError("");

    const resumeFile = formData.get("resumeFile");
    const payload: Record<string, string> = Object.fromEntries(
      [...formData.entries()]
        .filter(([key, value]) => key !== "resumeFile" && typeof value === "string")
        .map(([key, value]) => [key, String(value)])
    );

    if (mode === "problem") {
      if (reviewSchedule.customReviewDate) {
        payload.customReviewDate = reviewSchedule.customReviewDate;
      } else if (reviewSchedule.reviewPreset) {
        payload.reviewPreset = reviewSchedule.reviewPreset;
      }
    }

    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, type: mode })
      });

      const body = await response.json().catch(() => ({ error: "Could not save this item." }));

      if (!response.ok) {
        setError(body.error ?? "Could not save this item.");
        return;
      }

      if (
        mode === "application" &&
        body.applicationId &&
        resumeFile instanceof File &&
        resumeFile.size > 0 &&
        ACTIVE_APPLICATION_STATUSES.has(payload.status)
      ) {
        const uploadData = new FormData();
        uploadData.append("file", resumeFile);
        const uploadResponse = await fetch(`/api/applications/${body.applicationId}/resume`, {
          method: "POST",
          body: uploadData
        });

        if (!uploadResponse.ok) {
          const uploadBody = await uploadResponse.json().catch(() => ({ error: "Could not upload resume." }));
          setError(
            uploadBody.error ??
              "Application saved, but the resume upload failed. Edit the application to try again."
          );
          return;
        }
      }

      onClose?.();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="quick-add-tabs" role="tablist" aria-label="Quick add type">
        {modes.map((item) => (
          <button
            key={item.id}
            className={`quick-add-tab${mode === item.id ? " active" : ""}`}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            onClick={() => {
              setMode(item.id);
              setError("");
            }}
          >
            <span className="quick-add-tab-long">{item.label}</span>
            <span className="quick-add-tab-short">{item.short}</span>
          </button>
        ))}
      </div>

      <form action={submit} className="form-grid quick-add-form">
        {error ? <div className="error wide">{error}</div> : null}
        {mode === "problem" ? <ProblemFields onReviewChange={setReviewSchedule} /> : null}
        {mode === "application" ? <ApplicationFields /> : null}
        {mode === "project" ? <ProjectFields /> : null}
        {mode === "note" ? <NoteFields /> : null}
        <button className="button wide quick-add-submit" disabled={loading} type="submit">
          {modeIcon(mode)}
          {loading ? "Saving…" : "Save entry"}
        </button>
      </form>
    </>
  );
}

function ProblemFields({
  onReviewChange
}: {
  onReviewChange: (value: { reviewPreset?: ReviewPreset; customReviewDate?: string }) => void;
}) {
  return (
    <>
      <label className="field wide">
        <span>Problem name</span>
        <input name="name" placeholder="Number of Islands" required />
      </label>
      <label className="field wide">
        <span>Problem URL</span>
        <input name="url" type="url" placeholder="https://leetcode.com/..." inputMode="url" />
      </label>
      <label className="field">
        <span>Topic</span>
        <input name="topic" placeholder="Graphs" required />
      </label>
      <label className="field">
        <span>Pattern</span>
        <input name="pattern" placeholder="BFS, Union Find..." />
      </label>
      <label className="field wide">
        <span>Confidence</span>
        <select name="confidence" defaultValue="3">
          <option value="5">5 — Solved alone quickly</option>
          <option value="4">4 — Solved alone slowly</option>
          <option value="3">3 — Needed small hints</option>
          <option value="2">2 — Needed major hints</option>
          <option value="1">1 — Watched solution</option>
        </select>
      </label>
      <label className="field wide">
        <span>Notes</span>
        <textarea name="notes" placeholder="Key insight, edge cases, time complexity..." />
      </label>
      <ReviewScheduleField onChange={onReviewChange} />
    </>
  );
}

function ApplicationFields() {
  const [status, setStatus] = useState("WISHLIST");
  const showResume = ACTIVE_APPLICATION_STATUSES.has(status);

  return (
    <>
      <label className="field wide">
        <span>Company</span>
        <input name="company" placeholder="Stripe" required autoComplete="organization" />
      </label>
      <label className="field wide">
        <span>Role</span>
        <input name="role" placeholder="Backend Engineer" required />
      </label>
      <label className="field">
        <span>Status</span>
        <select name="status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="WISHLIST">Wishlist</option>
          <option value="APPLIED">Applied</option>
          <option value="OA">OA</option>
          <option value="INTERVIEW">Interview</option>
          <option value="OFFER">Offer</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </label>
      <label className="field">
        <span>Location</span>
        <input name="location" placeholder="Remote / SF" />
      </label>
      <label className="field wide">
        <span>Next action</span>
        <input name="nextAction" placeholder="Finish OA, prep system design..." />
      </label>
      {showResume ? (
        <div className="field wide resume-field">
          <span>Resume</span>
          <p className="field-hint">Attach the resume version you used for this application.</p>
          <input
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="resume-input"
            name="resumeFile"
            type="file"
          />
        </div>
      ) : null}
      <details className="field wide advanced-fields">
        <summary>More details</summary>
        <div className="form-grid nested-grid">
          <label className="field">
            <span>Job ID</span>
            <input name="jobId" placeholder="REQ-12345" />
          </label>
          <label className="field wide">
            <span>Job URL</span>
            <input name="jobUrl" type="url" placeholder="https://..." inputMode="url" />
          </label>
          <label className="field wide">
            <span>Notes</span>
            <textarea name="notes" placeholder="Recruiter, comp range, referral source..." />
          </label>
        </div>
      </details>
    </>
  );
}

function ProjectFields() {
  return (
    <>
      <label className="field wide">
        <span>Title</span>
        <input name="title" placeholder="Auth middleware" required />
      </label>
      <label className="field wide">
        <span>Next step</span>
        <input name="nextStep" placeholder="Wire JWT validation into middleware" required />
      </label>
      <label className="field wide">
        <span>Notes</span>
        <textarea name="notes" placeholder="Scope, constraints, links..." />
      </label>
    </>
  );
}

function NoteFields() {
  return (
    <>
      <label className="field wide">
        <span>Title</span>
        <input name="title" placeholder="Amazon LP story" required />
      </label>
      <label className="field">
        <span>Tag</span>
        <input name="tag" placeholder="Behavioral, DSA, Resume" required />
      </label>
      <label className="field wide">
        <span>Note</span>
        <textarea name="body" placeholder="Write the useful thing before it evaporates." required />
      </label>
    </>
  );
}

function modeIcon(mode: Mode) {
  if (mode === "application") return <BriefcaseBusiness size={18} />;
  if (mode === "note") return <NotebookPen size={18} />;
  if (mode === "project") return <FolderKanban size={18} />;
  return <Plus size={18} />;
}
