"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Download, FolderKanban, NotebookPen, Plus, X } from "lucide-react";
import { QuickAddReviewChips } from "@/components/quick-add/QuickAddReviewChips";
import {
  type EditTarget,
  type SheetMode,
  sheetModeFromEditTarget,
  topicPatternValue
} from "@/components/quick-add/entry-sheet-types";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/applications-utils";
import type { ReviewPreset } from "@/lib/review-schedule";
import { reviewDateFromPreset } from "@/lib/review-schedule";

const modes: Array<{ id: SheetMode; label: string }> = [
  { id: "problem", label: "DSA" },
  { id: "application", label: "Application" },
  { id: "project", label: "Project" },
  { id: "note", label: "Note" }
];

const CONFIDENCE_OPTIONS = [
  { value: "5", label: "5" },
  { value: "4", label: "4" },
  { value: "3", label: "3" },
  { value: "2", label: "2" },
  { value: "1", label: "1" }
];

const ACTIVE_APPLICATION_STATUSES = new Set(["APPLIED", "OA", "INTERVIEW", "OFFER", "REJECTED"]);

type EntrySheetProps = {
  open: boolean;
  onClose: () => void;
  editTarget?: EditTarget | null;
};

export function EntrySheet({ open, onClose, editTarget }: EntrySheetProps) {
  const isEdit = Boolean(editTarget);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal quick-add-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="quick-add-head">
          <div className="modal-header">
            <h2 className="panel-title" id="entry-sheet-title">
              {isEdit ? "Edit" : "Quick add"}
            </h2>
            <button
              className="icon-button secondary modal-close"
              type="button"
              aria-label="Close"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <EntrySheetForm
          key={editTarget ? `${editTarget.type}-${editTarget.data.id}` : "create"}
          editTarget={editTarget}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

function EntrySheetForm({
  editTarget,
  onClose
}: {
  editTarget?: EditTarget | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isEdit = Boolean(editTarget);
  const problem = editTarget?.type === "problem" ? editTarget.data : undefined;
  const application = editTarget?.type === "application" ? editTarget.data : undefined;
  const project = editTarget?.type === "project" ? editTarget.data : undefined;
  const reviewInitial = problem ? reviewInitialFromProblem(problem.nextReview, problem.lastPracticed) : null;

  const [mode, setMode] = useState<SheetMode>(editTarget ? sheetModeFromEditTarget(editTarget) : "problem");
  const [fieldsVisible, setFieldsVisible] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resumeRemoved, setResumeRemoved] = useState(false);
  const [reviewSchedule, setReviewSchedule] = useState<{ reviewPreset?: ReviewPreset; customReviewDate?: string }>(() =>
    initialReviewSchedule(problem)
  );

  function switchMode(next: SheetMode) {
    if (isEdit || next === mode) return;

    setFieldsVisible(false);
    window.setTimeout(() => {
      setMode(next);
      setError("");
      scrollRef.current?.scrollTo(0, 0);
      setFieldsVisible(true);
    }, 140);
  }

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
      const topicPattern = (payload.topicPattern ?? "").trim();
      delete payload.topicPattern;

      if (topicPattern.includes("/")) {
        const [topic, ...rest] = topicPattern.split("/");
        payload.topic = topic.trim();
        payload.pattern = rest.join("/").trim();
      } else {
        payload.topic = topicPattern;
        payload.pattern = "";
      }

      if (reviewSchedule.customReviewDate) {
        payload.customReviewDate = reviewSchedule.customReviewDate;
      } else if (reviewSchedule.reviewPreset) {
        payload.reviewPreset = reviewSchedule.reviewPreset;
      }
    }

    try {
      if (isEdit && editTarget) {
        await submitEdit(editTarget, mode, payload, resumeFile, resumeRemoved);
      } else {
        await submitCreate(mode, payload, resumeFile);
      }

      onClose();
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save this item.");
    } finally {
      setLoading(false);
    }
  }

  async function submitCreate(
    createMode: SheetMode,
    payload: Record<string, string>,
    resumeFile: FormDataEntryValue | null
  ) {
    const response = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, type: createMode })
    });

    const body = await response.json().catch(() => ({ error: "Could not save this item." }));

    if (!response.ok) {
      throw new Error(body.error ?? "Could not save this item.");
    }

    if (
      createMode === "application" &&
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
        throw new Error(
          uploadBody.error ?? "Application saved, but the resume upload failed. Edit the application to try again."
        );
      }
    }
  }

  async function submitEdit(
    target: EditTarget,
    editMode: SheetMode,
    payload: Record<string, string>,
    resumeFile: FormDataEntryValue | null,
    removeResume: boolean
  ) {
    if (editMode === "problem" && target.type === "problem") {
      const response = await fetch(`/api/problems/${target.data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({ error: "Could not save changes." }));
      if (!response.ok) throw new Error(body.error ?? "Could not save changes.");
      return;
    }

    if (editMode === "application" && target.type === "application") {
      const response = await fetch(`/api/applications/${target.data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({ error: "Could not save changes." }));
      if (!response.ok) throw new Error(body.error ?? "Could not save changes.");

      if (removeResume) {
        const deleteResponse = await fetch(`/api/applications/${target.data.id}/resume`, { method: "DELETE" });
        if (!deleteResponse.ok) {
          const deleteBody = await deleteResponse.json().catch(() => ({ error: "Could not remove resume." }));
          throw new Error(deleteBody.error ?? "Application saved, but removing the resume failed.");
        }
      }

      if (
        resumeFile instanceof File &&
        resumeFile.size > 0 &&
        ACTIVE_APPLICATION_STATUSES.has(payload.status)
      ) {
        const uploadData = new FormData();
        uploadData.append("file", resumeFile);
        const uploadResponse = await fetch(`/api/applications/${target.data.id}/resume`, {
          method: "POST",
          body: uploadData
        });
        if (!uploadResponse.ok) {
          const uploadBody = await uploadResponse.json().catch(() => ({ error: "Could not upload resume." }));
          throw new Error(uploadBody.error ?? "Application saved, but the resume upload failed.");
        }
      }
      return;
    }

    if (editMode === "project" && target.type === "project") {
      const response = await fetch(`/api/projects/${target.data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({ error: "Could not save changes." }));
      if (!response.ok) throw new Error(body.error ?? "Could not save changes.");
      return;
    }

    throw new Error("This entry type cannot be edited here.");
  }

  return (
    <>
      <div className="quick-add-tabs" role="tablist" aria-label="Entry type">
        {modes.map((item) => (
          <button
            key={item.id}
            className={`quick-add-tab${mode === item.id ? " active" : ""}`}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            disabled={isEdit && mode !== item.id}
            onClick={() => switchMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <form action={submit} className="quick-add-form">
        <div className="quick-add-scroll" ref={scrollRef}>
          {error ? <div className="error wide">{error}</div> : null}
          <div className={`quick-add-fields-shell${fieldsVisible ? " is-visible" : " is-hidden"}`}>
            <div className="quick-add-fields">
              {mode === "problem" ? (
                <ProblemFields
                  problem={problem}
                  reviewInitial={reviewInitial}
                  onReviewChange={setReviewSchedule}
                />
              ) : null}
              {mode === "application" ? (
                <ApplicationFields
                  application={application}
                  resumeRemoved={resumeRemoved}
                  onResumeRemove={() => setResumeRemoved(true)}
                />
              ) : null}
              {mode === "project" ? <ProjectFields project={project} /> : null}
              {mode === "note" ? <NoteFields /> : null}
            </div>
          </div>
        </div>
        <div className="quick-add-footer">
          <button className="button wide quick-add-submit" disabled={loading} type="submit">
            {modeIcon(mode)}
            {loading ? "Saving…" : isEdit ? "Save changes" : "Save"}
          </button>
        </div>
      </form>
    </>
  );
}

function ProblemFields({
  problem,
  reviewInitial,
  onReviewChange
}: {
  problem?: import("@/lib/problem-utils").ProblemRow;
  reviewInitial: { preset: ReviewPreset; customDate: string; isCustom: boolean } | null;
  onReviewChange: (value: { reviewPreset?: ReviewPreset; customReviewDate?: string }) => void;
}) {
  const [confidence, setConfidence] = useState(String(problem?.confidence ?? 3));

  return (
    <>
      <label className="quick-add-field">
        <span className="quick-add-label">Problem name</span>
        <input name="name" placeholder="Two Sum" required defaultValue={problem?.name ?? ""} />
      </label>
      <label className="quick-add-field">
        <span className="quick-add-label">Topic / pattern</span>
        <input
          name="topicPattern"
          placeholder="Array / Hash map"
          required
          defaultValue={problem ? topicPatternValue(problem.topic, problem.pattern) : ""}
        />
      </label>
      <div className="quick-add-field-block">
        <span className="quick-add-label">Confidence</span>
        <div className="quick-add-chips">
          {CONFIDENCE_OPTIONS.map((option) => (
            <button
              className={`quick-add-chip${confidence === option.value ? " active" : ""}`}
              key={option.value}
              onClick={() => setConfidence(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        <input name="confidence" type="hidden" value={confidence} />
      </div>
      <label className="quick-add-field">
        <span className="quick-add-label">Notes</span>
        <textarea name="notes" placeholder="Key insight, edge cases…" rows={2} defaultValue={problem?.notes ?? ""} />
      </label>
      <QuickAddReviewChips
        onChange={onReviewChange}
        initialPreset={reviewInitial?.preset ?? "oneWeek"}
        initialCustomDate={reviewInitial?.customDate ?? ""}
        initialCustom={reviewInitial?.isCustom ?? false}
      />
    </>
  );
}

function ApplicationFields({
  application,
  resumeRemoved,
  onResumeRemove
}: {
  application?: import("@prisma/client").Application;
  resumeRemoved: boolean;
  onResumeRemove: () => void;
}) {
  const [status, setStatus] = useState(application?.status ?? "WISHLIST");
  const showResume = ACTIVE_APPLICATION_STATUSES.has(status);
  const hasResume = Boolean(application?.resumeFileName) && !resumeRemoved;

  return (
    <>
      <label className="quick-add-field">
        <span className="quick-add-label">Company</span>
        <input
          name="company"
          placeholder="Stripe"
          required
          autoComplete="organization"
          defaultValue={application?.company ?? ""}
        />
      </label>
      <label className="quick-add-field">
        <span className="quick-add-label">Role</span>
        <input name="role" placeholder="Software Engineer" required defaultValue={application?.role ?? ""} />
      </label>
      <label className="quick-add-field">
        <span className="quick-add-label">Job ID</span>
        <input name="jobId" placeholder="REQ-23918" defaultValue={application?.jobId ?? ""} />
      </label>
      <label className="quick-add-field">
        <span className="quick-add-label">Status</span>
        <select name="status" value={status} onChange={(event) => setStatus(event.target.value)}>
          {APPLICATION_STATUSES.map((item) => (
            <option key={item} value={item}>
              {STATUS_LABELS[item]}
            </option>
          ))}
        </select>
      </label>
      <label className="quick-add-field">
        <span className="quick-add-label">Job URL</span>
        <input
          name="jobUrl"
          type="url"
          placeholder="https://…"
          inputMode="url"
          defaultValue={application?.jobUrl ?? ""}
        />
      </label>
      {showResume ? (
        <div className="quick-add-field">
          <span className="quick-add-label">Resume</span>
          {hasResume && application ? (
            <div className="quick-add-resume-current">
              <p className="quick-add-resume-name" title={application.resumeFileName ?? undefined}>
                {application.resumeFileName}
              </p>
              <div className="quick-add-resume-actions">
                <a
                  className="quick-add-resume-action"
                  href={`/api/applications/${application.id}/resume`}
                  download={application.resumeFileName ?? undefined}
                >
                  <Download size={14} />
                  Download
                </a>
                <label className="quick-add-resume-action">
                  Replace
                  <input
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="quick-add-resume-file-input"
                    name="resumeFile"
                    type="file"
                  />
                </label>
                <button className="quick-add-resume-action danger" onClick={onResumeRemove} type="button">
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <input
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="quick-add-file"
              name="resumeFile"
              type="file"
            />
          )}
        </div>
      ) : null}
      <label className="quick-add-field">
        <span className="quick-add-label">Notes</span>
        <textarea name="notes" placeholder="Recruiter, comp range…" rows={2} defaultValue={application?.notes ?? ""} />
      </label>
    </>
  );
}

function ProjectFields({ project }: { project?: import("@prisma/client").Project }) {
  return (
    <>
      <label className="quick-add-field">
        <span className="quick-add-label">Project name</span>
        <input name="title" placeholder="Switchboard MVP" required defaultValue={project?.title ?? ""} />
      </label>
      <label className="quick-add-field">
        <span className="quick-add-label">Status</span>
        <select name="status" defaultValue={project?.status ?? "ACTIVE"}>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </label>
      <label className="quick-add-field">
        <span className="quick-add-label">Next step</span>
        <input
          name="nextStep"
          placeholder="Ship revision engine"
          required
          defaultValue={project?.nextStep ?? ""}
        />
      </label>
      <label className="quick-add-field">
        <span className="quick-add-label">Notes</span>
        <textarea name="notes" placeholder="Scope, constraints…" rows={2} defaultValue={project?.notes ?? ""} />
      </label>
    </>
  );
}

function NoteFields() {
  return (
    <>
      <label className="quick-add-field">
        <span className="quick-add-label">Title</span>
        <input name="title" placeholder="Amazon LP story" required />
      </label>
      <label className="quick-add-field">
        <span className="quick-add-label">Tag</span>
        <input name="tag" placeholder="Behavioral" required />
      </label>
      <label className="quick-add-field">
        <span className="quick-add-label">Note</span>
        <textarea name="body" placeholder="Write it before it evaporates." required rows={3} />
      </label>
    </>
  );
}

function modeIcon(mode: SheetMode) {
  if (mode === "application") return <BriefcaseBusiness size={18} />;
  if (mode === "note") return <NotebookPen size={18} />;
  if (mode === "project") return <FolderKanban size={18} />;
  return <Plus size={18} />;
}

function reviewInitialFromProblem(
  nextReview: string | null,
  lastPracticed: string | null
): { preset: ReviewPreset; customDate: string; isCustom: boolean } {
  if (!nextReview) {
    return { preset: "oneWeek", customDate: "", isCustom: false };
  }

  const reviewDate = new Date(nextReview);
  const anchor = lastPracticed ? new Date(lastPracticed) : new Date();
  const presetOrder: ReviewPreset[] = ["tomorrow", "threeDays", "oneWeek", "twoWeeks", "oneMonth"];

  for (const preset of presetOrder) {
    const presetDate = reviewDateFromPreset(preset, anchor);
    if (sameCalendarDay(presetDate, reviewDate)) {
      return { preset, customDate: "", isCustom: false };
    }
  }

  return {
    preset: "oneWeek",
    customDate: nextReview.slice(0, 10),
    isCustom: true
  };
}

function sameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

function initialReviewSchedule(problem?: import("@/lib/problem-utils").ProblemRow): {
  reviewPreset?: ReviewPreset;
  customReviewDate?: string;
} {
  if (!problem) return { reviewPreset: "oneWeek" };
  const initial = reviewInitialFromProblem(problem.nextReview, problem.lastPracticed);
  if (initial.isCustom && initial.customDate) {
    return { customReviewDate: initial.customDate };
  }
  return { reviewPreset: initial.preset };
}
