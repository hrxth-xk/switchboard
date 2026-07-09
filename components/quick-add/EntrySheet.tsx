"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Download, FolderKanban, NotebookPen, Plus, X } from "lucide-react";
import { QuickAddReviewChips } from "@/components/quick-add/QuickAddReviewChips";
import {
  EntrySheetSubmitError,
  mapApiFieldErrors,
  validateEntryPayload
} from "@/components/quick-add/entry-sheet-validation";
import {
  type EditTarget,
  type SheetMode,
  sheetModeFromEditTarget,
  topicPatternValue
} from "@/components/quick-add/entry-sheet-types";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/applications-utils";
import type { FieldErrors } from "@/lib/api-errors";
import type { ReviewPreset } from "@/lib/review-schedule";
import { reviewDateFromPreset } from "@/lib/review-schedule";
import { SavingSpinner } from "@/components/ui/SavingSpinner";
import { usePendingAction } from "@/hooks/usePendingAction";

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
  const { run, isPending } = usePendingAction<"submit">();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isEdit = Boolean(editTarget);
  const problem = editTarget?.type === "problem" ? editTarget.data : undefined;
  const application = editTarget?.type === "application" ? editTarget.data : undefined;
  const project = editTarget?.type === "project" ? editTarget.data : undefined;
  const reviewInitial = problem ? reviewInitialFromProblem(problem.nextReview, problem.lastPracticed) : null;

  const [mode, setMode] = useState<SheetMode>(editTarget ? sheetModeFromEditTarget(editTarget) : "problem");
  const [fieldsVisible, setFieldsVisible] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [toast, setToast] = useState("");
  const [resumeRemoved, setResumeRemoved] = useState(false);
  const [reviewSchedule, setReviewSchedule] = useState<{ reviewPreset?: ReviewPreset; customReviewDate?: string }>(() =>
    initialReviewSchedule(problem)
  );

  function switchMode(next: SheetMode) {
    if (isEdit || next === mode) return;

    setFieldsVisible(false);
    window.setTimeout(() => {
      setMode(next);
      setFieldErrors({});
      setToast("");
      scrollRef.current?.scrollTo(0, 0);
      setFieldsVisible(true);
    }, 140);
  }

  function clearFieldError(name: string) {
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function scrollToFirstError(errors: FieldErrors) {
    const firstKey = Object.keys(errors)[0];
    if (!firstKey || !scrollRef.current) return;
    const field = scrollRef.current.querySelector(`[data-field="${firstKey}"]`);
    if (field instanceof HTMLElement) {
      field.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function handleSubmitFailure(message: string, errors: FieldErrors = {}) {
    setFieldErrors(errors);
    setToast(message);
    if (Object.keys(errors).length > 0) {
      window.requestAnimationFrame(() => scrollToFirstError(errors));
    }
  }

  async function submit(formData: FormData) {
    await run("submit", async () => {
      setFieldErrors({});
      setToast("");

      const resumeFile = formData.get("resumeFile");
      const payload: Record<string, string> = Object.fromEntries(
        [...formData.entries()]
          .filter(([key, value]) => key !== "resumeFile" && typeof value === "string")
          .map(([key, value]) => [key, String(value)])
      );

      const clientErrors = validateEntryPayload(mode, payload);
      if (Object.keys(clientErrors).length > 0) {
        handleSubmitFailure("Please correct the highlighted fields.", clientErrors);
        return;
      }

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
        if (submitError instanceof EntrySheetSubmitError) {
          handleSubmitFailure(
            submitError.message,
            submitError.fieldErrors ?? {}
          );
        } else {
          handleSubmitFailure(
            submitError instanceof Error ? submitError.message : "Unable to save this item."
          );
        }
      }
    });
  }

  const saving = isPending("submit");

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
      throw new EntrySheetSubmitError(
        body.error ?? "Could not save this item.",
        mapApiFieldErrors(body.fieldErrors)
      );
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
        throw new EntrySheetSubmitError(
          uploadBody.error ?? "Unable to save application.",
          uploadBody.fieldErrors
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
      if (!response.ok) {
        throw new EntrySheetSubmitError(
          body.error ?? "Could not save changes.",
          mapApiFieldErrors(body.fieldErrors)
        );
      }
      return;
    }

    if (editMode === "application" && target.type === "application") {
      const response = await fetch(`/api/applications/${target.data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({ error: "Could not save changes." }));
      if (!response.ok) {
        throw new EntrySheetSubmitError(
          body.error ?? "Could not save changes.",
          mapApiFieldErrors(body.fieldErrors)
        );
      }

      if (removeResume) {
        const deleteResponse = await fetch(`/api/applications/${target.data.id}/resume`, { method: "DELETE" });
        if (!deleteResponse.ok) {
          const deleteBody = await deleteResponse.json().catch(() => ({ error: "Could not remove resume." }));
          throw new EntrySheetSubmitError(deleteBody.error ?? "Unable to save application.");
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
          throw new EntrySheetSubmitError(uploadBody.error ?? "Unable to save application.");
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
      if (!response.ok) {
        throw new EntrySheetSubmitError(
          body.error ?? "Could not save changes.",
          mapApiFieldErrors(body.fieldErrors)
        );
      }
      return;
    }

    throw new EntrySheetSubmitError("This entry type cannot be edited here.");
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

      <form action={submit} className="quick-add-form" noValidate>
        <div className="quick-add-scroll" ref={scrollRef}>
          <div className={`quick-add-fields-shell${fieldsVisible ? " is-visible" : " is-hidden"}`}>
            <div className="quick-add-fields">
              {mode === "problem" ? (
                <ProblemFields
                  fieldErrors={fieldErrors}
                  onClearError={clearFieldError}
                  problem={problem}
                  reviewInitial={reviewInitial}
                  onReviewChange={setReviewSchedule}
                />
              ) : null}
              {mode === "application" ? (
                <ApplicationFields
                  application={application}
                  fieldErrors={fieldErrors}
                  onClearError={clearFieldError}
                  resumeRemoved={resumeRemoved}
                  onResumeRemove={() => setResumeRemoved(true)}
                />
              ) : null}
              {mode === "project" ? (
                <ProjectFields fieldErrors={fieldErrors} onClearError={clearFieldError} project={project} />
              ) : null}
              {mode === "note" ? (
                <NoteFields fieldErrors={fieldErrors} onClearError={clearFieldError} />
              ) : null}
            </div>
          </div>
        </div>
        {toast ? (
          <div className="entry-sheet-toast" role="status" aria-live="polite">
            {toast}
          </div>
        ) : null}
        <div className="quick-add-footer">
          <button
            className={`button wide quick-add-submit${saving ? " is-saving" : ""}`}
            disabled={saving}
            type="submit"
          >
            {saving ? <SavingSpinner /> : modeIcon(mode)}
            {saving ? "Saving…" : isEdit ? "Save changes" : "Save"}
          </button>
        </div>
      </form>
    </>
  );
}

function ProblemFields({
  problem,
  reviewInitial,
  onReviewChange,
  fieldErrors,
  onClearError
}: {
  problem?: import("@/lib/problem-utils").ProblemRow;
  reviewInitial: { preset: ReviewPreset; customDate: string; isCustom: boolean } | null;
  onReviewChange: (value: { reviewPreset?: ReviewPreset; customReviewDate?: string }) => void;
  fieldErrors: FieldErrors;
  onClearError: (name: string) => void;
}) {
  const [confidence, setConfidence] = useState(String(problem?.confidence ?? 3));

  return (
    <>
      <QuickAddField error={fieldErrors.name} label="Problem name" name="name" onClearError={onClearError}>
        <input
          name="name"
          placeholder="Two Sum"
          defaultValue={problem?.name ?? ""}
          onInput={() => onClearError("name")}
        />
      </QuickAddField>
      <QuickAddField
        error={fieldErrors.topicPattern}
        label="Topic / pattern"
        name="topicPattern"
        onClearError={onClearError}
      >
        <input
          name="topicPattern"
          placeholder="Array / Hash map"
          defaultValue={problem ? topicPatternValue(problem.topic, problem.pattern) : ""}
          onInput={() => onClearError("topicPattern")}
        />
      </QuickAddField>
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
      <QuickAddField error={fieldErrors.notes} label="Notes" name="notes" onClearError={onClearError}>
        <textarea
          name="notes"
          placeholder="Key insight, edge cases…"
          rows={2}
          defaultValue={problem?.notes ?? ""}
          onInput={() => onClearError("notes")}
        />
      </QuickAddField>
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
  onResumeRemove,
  fieldErrors,
  onClearError
}: {
  application?: import("@prisma/client").Application;
  resumeRemoved: boolean;
  onResumeRemove: () => void;
  fieldErrors: FieldErrors;
  onClearError: (name: string) => void;
}) {
  const [status, setStatus] = useState(application?.status ?? "WISHLIST");
  const showResume = ACTIVE_APPLICATION_STATUSES.has(status);
  const hasResume = Boolean(application?.resumeFileName) && !resumeRemoved;

  return (
    <>
      <QuickAddField error={fieldErrors.company} label="Company" name="company" onClearError={onClearError}>
        <input
          name="company"
          placeholder="Stripe"
          autoComplete="organization"
          defaultValue={application?.company ?? ""}
          onInput={() => onClearError("company")}
        />
      </QuickAddField>
      <QuickAddField error={fieldErrors.role} label="Role" name="role" onClearError={onClearError}>
        <input
          name="role"
          placeholder="Software Engineer"
          defaultValue={application?.role ?? ""}
          onInput={() => onClearError("role")}
        />
      </QuickAddField>
      <QuickAddField error={fieldErrors.jobId} label="Job ID" name="jobId" onClearError={onClearError}>
        <input
          name="jobId"
          placeholder="REQ-23918"
          defaultValue={application?.jobId ?? ""}
          onInput={() => onClearError("jobId")}
        />
      </QuickAddField>
      <QuickAddField error={fieldErrors.status} label="Status" name="status" onClearError={onClearError}>
        <select
          name="status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            onClearError("status");
          }}
        >
          {APPLICATION_STATUSES.map((item) => (
            <option key={item} value={item}>
              {STATUS_LABELS[item]}
            </option>
          ))}
        </select>
      </QuickAddField>
      <QuickAddField error={fieldErrors.jobUrl} label="Job URL" name="jobUrl" onClearError={onClearError}>
        <input
          name="jobUrl"
          type="url"
          placeholder="https://…"
          inputMode="url"
          defaultValue={application?.jobUrl ?? ""}
          onInput={() => onClearError("jobUrl")}
        />
      </QuickAddField>
      {showResume ? (
        <div className="quick-add-field" data-field="resumeFile">
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
      <QuickAddField error={fieldErrors.notes} label="Notes" name="notes" onClearError={onClearError}>
        <textarea
          name="notes"
          placeholder="Recruiter, comp range…"
          rows={2}
          defaultValue={application?.notes ?? ""}
          onInput={() => onClearError("notes")}
        />
      </QuickAddField>
    </>
  );
}

function ProjectFields({
  project,
  fieldErrors,
  onClearError
}: {
  project?: import("@prisma/client").Project;
  fieldErrors: FieldErrors;
  onClearError: (name: string) => void;
}) {
  return (
    <>
      <QuickAddField error={fieldErrors.title} label="Project name" name="title" onClearError={onClearError}>
        <input
          name="title"
          placeholder="Switchboard MVP"
          defaultValue={project?.title ?? ""}
          onInput={() => onClearError("title")}
        />
      </QuickAddField>
      <QuickAddField error={fieldErrors.status} label="Status" name="status" onClearError={onClearError}>
        <select
          name="status"
          defaultValue={project?.status ?? "ACTIVE"}
          onChange={() => onClearError("status")}
        >
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </QuickAddField>
      <QuickAddField error={fieldErrors.nextStep} label="Next step" name="nextStep" onClearError={onClearError}>
        <input
          name="nextStep"
          placeholder="Ship revision engine"
          defaultValue={project?.nextStep ?? ""}
          onInput={() => onClearError("nextStep")}
        />
      </QuickAddField>
      <QuickAddField error={fieldErrors.notes} label="Notes" name="notes" onClearError={onClearError}>
        <textarea
          name="notes"
          placeholder="Scope, constraints…"
          rows={2}
          defaultValue={project?.notes ?? ""}
          onInput={() => onClearError("notes")}
        />
      </QuickAddField>
    </>
  );
}

function NoteFields({
  fieldErrors,
  onClearError
}: {
  fieldErrors: FieldErrors;
  onClearError: (name: string) => void;
}) {
  return (
    <>
      <QuickAddField error={fieldErrors.title} label="Title" name="title" onClearError={onClearError}>
        <input name="title" placeholder="Amazon LP story" onInput={() => onClearError("title")} />
      </QuickAddField>
      <QuickAddField error={fieldErrors.tag} label="Tag" name="tag" onClearError={onClearError}>
        <input name="tag" placeholder="Behavioral" onInput={() => onClearError("tag")} />
      </QuickAddField>
      <QuickAddField error={fieldErrors.body} label="Note" name="body" onClearError={onClearError}>
        <textarea
          name="body"
          placeholder="Write it before it evaporates."
          required={false}
          rows={3}
          onInput={() => onClearError("body")}
        />
      </QuickAddField>
    </>
  );
}

function QuickAddField({
  name,
  label,
  error,
  onClearError,
  children,
  className = "quick-add-field"
}: {
  name: string;
  label: string;
  error?: string;
  onClearError: (name: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`${className}${error ? " has-error" : ""}`} data-field={name}>
      <span className="quick-add-label">{label}</span>
      {children}
      {error ? (
        <span className="quick-add-field-error" role="alert">
          {error}
        </span>
      ) : null}
    </label>
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
