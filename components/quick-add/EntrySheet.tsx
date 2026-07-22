"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, FolderKanban, NotebookPen, Plus, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ResumeVersionSelectLoader } from "@/components/resumes/ResumeVersionSelect";
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
import type { JobImportResult } from "@/lib/job-import/types";
import type { ReviewPreset } from "@/lib/review-schedule";
import { reviewDateFromPreset, withNextRevisitToast } from "@/lib/review-schedule";
import { SavingSpinner } from "@/components/ui/SavingSpinner";
import { toastError, toastSuccess } from "@/lib/toast";
import { usePendingAction } from "@/hooks/usePendingAction";

const JOB_IMPORT_FALLBACK = "We couldn't extract the job details. Please fill them manually.";

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

const CREATE_SUCCESS_MESSAGE: Record<SheetMode, string> = {
  problem: "Problem logged",
  application: "Application added",
  project: "Project added",
  note: "Note saved"
};

const EDIT_SUCCESS_MESSAGE: Record<SheetMode, string> = {
  problem: "Problem updated",
  application: "Application updated",
  project: "Project updated",
  note: "Note updated"
};

type EntrySheetProps = {
  open: boolean;
  onClose: () => void;
  editTarget?: EditTarget | null;
  initialMode?: SheetMode;
};

export function EntrySheet({ open, onClose, editTarget, initialMode }: EntrySheetProps) {
  const isEdit = Boolean(editTarget);

  return (
    <Modal open={open} onClose={onClose} className="quick-add-modal" labelledBy="entry-sheet-title">
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
        initialMode={initialMode}
        onClose={onClose}
      />
    </Modal>
  );
}

function EntrySheetForm({
  editTarget,
  initialMode,
  onClose
}: {
  editTarget?: EditTarget | null;
  initialMode?: SheetMode;
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

  const [mode, setMode] = useState<SheetMode>(
    editTarget ? sheetModeFromEditTarget(editTarget) : initialMode ?? "problem"
  );
  const [fieldsVisible, setFieldsVisible] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [toast, setToast] = useState("");
  const [resumeVersionId, setResumeVersionId] = useState(application?.resumeVersionId ?? "");
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

      const payload: Record<string, string> = Object.fromEntries(
        [...formData.entries()]
          .filter(([, value]) => typeof value === "string")
          .map(([key, value]) => [key, String(value)])
      );

      if (mode === "application") {
        payload.resumeVersionId = resumeVersionId;
      }

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
          await submitEdit(editTarget, mode, payload);
        } else {
          await submitCreate(mode, payload);
        }

        const baseMessage = isEdit ? EDIT_SUCCESS_MESSAGE[mode] : CREATE_SUCCESS_MESSAGE[mode];
        toastSuccess(
          mode === "problem" && reviewSchedule.customReviewDate
            ? withNextRevisitToast(baseMessage, { customReviewDate: reviewSchedule.customReviewDate })
            : baseMessage
        );
        onClose();
        router.refresh();
      } catch (submitError) {
        if (submitError instanceof EntrySheetSubmitError) {
          handleSubmitFailure(
            submitError.message,
            submitError.fieldErrors ?? {}
          );
          toastError(submitError.message);
        } else {
          const message = submitError instanceof Error ? submitError.message : "Unable to save this item.";
          handleSubmitFailure(message);
          toastError(message);
        }
      }
    });
  }

  const saving = isPending("submit");

  async function submitCreate(createMode: SheetMode, payload: Record<string, string>) {
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
  }

  async function submitEdit(target: EditTarget, editMode: SheetMode, payload: Record<string, string>) {
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
        body: JSON.stringify({
          ...payload,
          resumeVersionId: payload.resumeVersionId ? payload.resumeVersionId : null
        })
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
                  onResumeVersionChange={setResumeVersionId}
                  resumeVersionId={resumeVersionId}
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

function looksLikeLeetCodeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      /(^|\.)leetcode\.(com|cn)$/i.test(url.hostname) &&
      /\/problems\//i.test(url.pathname)
    );
  } catch {
    return false;
  }
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
  const [url, setUrl] = useState(problem?.url ?? "");
  const [slug, setSlug] = useState(problem?.slug ?? "");
  const [name, setName] = useState(problem?.name ?? "");
  const [topicPattern, setTopicPattern] = useState(
    problem ? topicPatternValue(problem.topic, problem.pattern) : ""
  );
  const [difficulty, setDifficulty] = useState(problem?.difficulty ?? "");
  const [notes, setNotes] = useState(problem?.notes ?? "");
  const [importState, setImportState] = useState<"idle" | "loading" | "success" | "failed">("idle");
  const [importMessage, setImportMessage] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(Boolean(problem));
  const lastImportedUrl = useRef(problem?.url?.trim() ?? "");
  const importRequestId = useRef(0);

  async function runImport(rawUrl: string) {
    const trimmed = rawUrl.trim();
    if (!looksLikeLeetCodeUrl(trimmed)) return;
    if (trimmed === lastImportedUrl.current) return;

    const requestId = ++importRequestId.current;
    setImportState("loading");
    setImportMessage("Fetching LeetCode problem…");

    try {
      const response = await fetch("/api/problems/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed })
      });
      const body = (await response.json().catch(() => null)) as
        | {
            ok: true;
            problem: {
              title: string;
              slug: string;
              url: string;
              difficulty: string | null;
              topic: string;
              pattern: string | null;
              tags: string[];
            };
          }
        | { ok: false; error?: string }
        | null;

      if (requestId !== importRequestId.current) return;
      lastImportedUrl.current = trimmed;

      if (!body || !body.ok) {
        setImportState("failed");
        setImportMessage(
          body && "error" in body && body.error
            ? body.error
            : "We couldn't fetch that LeetCode problem. Please fill the details manually."
        );
        setDetailsOpen(true);
        return;
      }

      const imported = body.problem;
      setUrl(imported.url || trimmed);
      setSlug(imported.slug);
      setName(imported.title);
      setTopicPattern(topicPatternValue(imported.topic, imported.pattern));
      setDifficulty(imported.difficulty ?? "");
      onClearError("name");
      onClearError("topicPattern");
      onClearError("url");
      setImportState("success");
      setImportMessage("");
      setDetailsOpen(false);
      lastImportedUrl.current = imported.url || trimmed;
    } catch {
      if (requestId !== importRequestId.current) return;
      lastImportedUrl.current = trimmed;
      setImportState("failed");
      setImportMessage("We couldn't fetch that LeetCode problem. Please fill the details manually.");
      setDetailsOpen(true);
    }
  }

  useEffect(() => {
    return () => {
      importRequestId.current += 1;
    };
  }, []);

  useEffect(() => {
    if (fieldErrors.name || fieldErrors.topicPattern) {
      setDetailsOpen(true);
    }
  }, [fieldErrors]);

  const showImportSummary = importState === "success" && name && topicPattern && !detailsOpen;

  return (
    <>
      <QuickAddField error={fieldErrors.url} label="LeetCode Problem URL" name="url" onClearError={onClearError}>
        <input
          name="url"
          type="url"
          placeholder="https://leetcode.com/problems/two-sum/"
          inputMode="url"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            onClearError("url");
            if (importState !== "idle" && importState !== "loading") {
              setImportState("idle");
              setImportMessage("");
            }
          }}
          onPaste={() => {
            window.setTimeout(() => {
              const input = document.activeElement;
              if (input instanceof HTMLInputElement) {
                void runImport(input.value);
              }
            }, 0);
          }}
          onBlur={() => {
            void runImport(url);
          }}
        />
      </QuickAddField>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="difficulty" value={difficulty} />

      {importState === "loading" || importState === "failed" ? (
        <p
          className={`job-import-status${importState === "failed" ? " is-error" : ""}`}
          role="status"
          aria-live="polite"
        >
          {importMessage}
        </p>
      ) : null}

      {showImportSummary ? (
        <div className="job-import-summary">
          <div>
            <p className="job-import-summary-title">{name}</p>
            <p className="job-import-summary-meta">
              {[difficulty, topicPattern].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button
            className="button secondary job-import-edit"
            type="button"
            onClick={() => setDetailsOpen(true)}
          >
            Edit details
          </button>
        </div>
      ) : null}

      {detailsOpen || importState !== "success" ? (
        <>
          <QuickAddField error={fieldErrors.name} label="Problem name" name="name" onClearError={onClearError}>
            <input
              name="name"
              placeholder="Two Sum"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                onClearError("name");
              }}
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
              value={topicPattern}
              onChange={(event) => {
                setTopicPattern(event.target.value);
                onClearError("topicPattern");
              }}
            />
          </QuickAddField>
        </>
      ) : (
        <>
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="topicPattern" value={topicPattern} />
        </>
      )}

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
          value={notes}
          onChange={(event) => {
            setNotes(event.target.value);
            onClearError("notes");
          }}
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

function looksLikeJobUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function ApplicationFields({
  application,
  resumeVersionId,
  onResumeVersionChange,
  fieldErrors,
  onClearError
}: {
  application?: import("@/components/quick-add/entry-sheet-types").ApplicationEditData;
  resumeVersionId: string;
  onResumeVersionChange: (id: string) => void;
  fieldErrors: FieldErrors;
  onClearError: (name: string) => void;
}) {
  const [status, setStatus] = useState(application?.status ?? "WISHLIST");
  const [jobUrl, setJobUrl] = useState(application?.jobUrl ?? "");
  const [company, setCompany] = useState(application?.company ?? "");
  const [role, setRole] = useState(application?.role ?? "");
  const [jobId, setJobId] = useState(application?.jobId ?? "");
  const [location, setLocation] = useState(application?.location ?? "");
  const [notes, setNotes] = useState(application?.notes ?? "");
  const [importState, setImportState] = useState<"idle" | "loading" | "success" | "failed">("idle");
  const [importMessage, setImportMessage] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(Boolean(application));
  const lastImportedUrl = useRef(application?.jobUrl?.trim() ?? "");
  const importRequestId = useRef(0);

  async function runImport(rawUrl: string) {
    const trimmed = rawUrl.trim();
    if (!looksLikeJobUrl(trimmed)) return;
    if (trimmed === lastImportedUrl.current) return;

    const requestId = ++importRequestId.current;
    setImportState("loading");
    setImportMessage("Extracting job details…");

    try {
      const response = await fetch("/api/jobs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed })
      });
      const body = (await response.json().catch(() => null)) as
        | { ok: true; job: JobImportResult }
        | { ok: false; error?: string }
        | null;

      if (requestId !== importRequestId.current) return;

      lastImportedUrl.current = trimmed;

      if (!body || !body.ok) {
        setImportState("failed");
        setImportMessage(body && "error" in body && body.error ? body.error : JOB_IMPORT_FALLBACK);
        setDetailsOpen(true);
        return;
      }

      const job = body.job;
      setJobUrl(job.jobUrl || trimmed);
      setCompany(job.company);
      setRole(job.role);
      setJobId(job.jobId ?? "");
      setLocation(job.location ?? "");
      if (job.description) {
        const snippet = job.description.slice(0, 500);
        setNotes((current) => (current.trim() ? current : snippet));
      }
      onClearError("company");
      onClearError("role");
      onClearError("jobId");
      onClearError("jobUrl");
      onClearError("location");
      setImportState("success");
      setImportMessage("");
      setDetailsOpen(false);
      lastImportedUrl.current = job.jobUrl || trimmed;
    } catch {
      if (requestId !== importRequestId.current) return;
      lastImportedUrl.current = trimmed;
      setImportState("failed");
      setImportMessage(JOB_IMPORT_FALLBACK);
      setDetailsOpen(true);
    }
  }

  useEffect(() => {
    return () => {
      importRequestId.current += 1;
    };
  }, []);

  useEffect(() => {
    if (fieldErrors.company || fieldErrors.role || fieldErrors.jobId || fieldErrors.location) {
      setDetailsOpen(true);
    }
  }, [fieldErrors]);

  const showImportSummary = importState === "success" && company && role && !detailsOpen;

  return (
    <>
      <QuickAddField error={fieldErrors.jobUrl} label="Job URL" name="jobUrl" onClearError={onClearError}>
        <input
          name="jobUrl"
          type="url"
          placeholder="LinkedIn, Greenhouse, Lever, Ashby…"
          inputMode="url"
          value={jobUrl}
          onChange={(event) => {
            setJobUrl(event.target.value);
            onClearError("jobUrl");
            if (importState !== "idle" && importState !== "loading") {
              setImportState("idle");
              setImportMessage("");
            }
          }}
          onPaste={() => {
            window.setTimeout(() => {
              const input = document.activeElement;
              if (input instanceof HTMLInputElement) {
                void runImport(input.value);
              }
            }, 0);
          }}
          onBlur={() => {
            void runImport(jobUrl);
          }}
        />
      </QuickAddField>

      {importState === "loading" || importState === "failed" ? (
        <p
          className={`job-import-status${importState === "failed" ? " is-error" : ""}`}
          role="status"
          aria-live="polite"
        >
          {importMessage}
        </p>
      ) : null}

      {showImportSummary ? (
        <div className="job-import-summary">
          <div>
            <p className="job-import-summary-title">
              {company} · {role}
            </p>
            {location || jobId ? (
              <p className="job-import-summary-meta">
                {[location, jobId ? `ID ${jobId}` : null].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </div>
          <button
            className="button secondary job-import-edit"
            type="button"
            onClick={() => setDetailsOpen(true)}
          >
            Edit details
          </button>
        </div>
      ) : null}

      {detailsOpen || importState !== "success" ? (
        <>
          <QuickAddField error={fieldErrors.company} label="Company" name="company" onClearError={onClearError}>
            <input
              name="company"
              placeholder="Stripe"
              autoComplete="organization"
              value={company}
              onChange={(event) => {
                setCompany(event.target.value);
                onClearError("company");
              }}
            />
          </QuickAddField>
          <QuickAddField error={fieldErrors.role} label="Role" name="role" onClearError={onClearError}>
            <input
              name="role"
              placeholder="Software Engineer"
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                onClearError("role");
              }}
            />
          </QuickAddField>
          <QuickAddField error={fieldErrors.jobId} label="Job ID" name="jobId" onClearError={onClearError}>
            <input
              name="jobId"
              placeholder="REQ-23918"
              value={jobId}
              onChange={(event) => {
                setJobId(event.target.value);
                onClearError("jobId");
              }}
            />
          </QuickAddField>
          <QuickAddField error={fieldErrors.location} label="Location" name="location" onClearError={onClearError}>
            <input
              name="location"
              placeholder="San Francisco, CA"
              value={location}
              onChange={(event) => {
                setLocation(event.target.value);
                onClearError("location");
              }}
            />
          </QuickAddField>
        </>
      ) : (
        <>
          <input type="hidden" name="company" value={company} />
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="jobId" value={jobId} />
          <input type="hidden" name="location" value={location} />
        </>
      )}

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
      <ResumeVersionSelectLoader
        error={fieldErrors.resumeVersionId}
        onChange={(id) => {
          onResumeVersionChange(id);
          onClearError("resumeVersionId");
        }}
        value={resumeVersionId}
      />
      <QuickAddField error={fieldErrors.notes} label="Notes" name="notes" onClearError={onClearError}>
        <textarea
          name="notes"
          placeholder="Recruiter, comp range…"
          rows={2}
          value={notes}
          onChange={(event) => {
            setNotes(event.target.value);
            onClearError("notes");
          }}
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
