"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
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
import { calendarDayKey } from "@/lib/period-utils";
import { ImportStatus } from "@/components/quick-add/ImportStatus";
import { useUrlImport } from "@/hooks/useUrlImport";
import { JOB_IMPORT_MESSAGES, PROBLEM_IMPORT_FALLBACK } from "@/lib/job-import/messages";
import type { FieldSource, JobField, JobImportSuccess } from "@/lib/job-import/types";
import { looksLikeJobUrl, normalizeJobUrl, parseJobUrl } from "@/lib/job-import/url-parse";
import type { ReviewPreset } from "@/lib/review-schedule";
import { reviewDateFromPreset, withNextRevisitToast } from "@/lib/review-schedule";
import { SavingSpinner } from "@/components/ui/SavingSpinner";
import { toastError, toastSuccess } from "@/lib/toast";
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
        // The API requires a full URL; accept "stripe.com/jobs/1" and add the
        // scheme here rather than making the user retype it.
        const normalized = payload.jobUrl?.trim() ? normalizeJobUrl(payload.jobUrl) : null;
        if (normalized) payload.jobUrl = normalized.toString();

        // A picked date only carries information when it is not today. Sending
        // today would replace the exact save instant with local noon.
        if (!isEdit && payload.appliedAt === calendarDayKey(new Date())) {
          delete payload.appliedAt;
        }
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
                  saving={saving}
                />
              ) : null}
              {mode === "application" ? (
                <ApplicationFields
                  application={application}
                  fieldErrors={fieldErrors}
                  onClearError={clearFieldError}
                  onResumeVersionChange={setResumeVersionId}
                  resumeVersionId={resumeVersionId}
                  saving={saving}
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

type ImportedProblem = {
  title: string;
  slug: string;
  url: string;
  difficulty: string | null;
  topic: string;
  pattern: string | null;
  tags: string[];
};

function ProblemFields({
  problem,
  reviewInitial,
  onReviewChange,
  fieldErrors,
  onClearError,
  saving
}: {
  problem?: import("@/lib/problem-utils").ProblemRow;
  reviewInitial: { preset: ReviewPreset; customDate: string; isCustom: boolean } | null;
  onReviewChange: (value: { reviewPreset?: ReviewPreset; customReviewDate?: string }) => void;
  fieldErrors: FieldErrors;
  onClearError: (name: string) => void;
  saving: boolean;
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
  const [detailsOpen, setDetailsOpen] = useState(Boolean(problem));
  const isEdit = Boolean(problem);

  const importer = useUrlImport<ImportedProblem>({
    endpoint: "/api/problems/import",
    isSupportedUrl: looksLikeLeetCodeUrl,
    autoRun: !isEdit,
    disabled: saving,
    loadingMessage: "Fetching LeetCode problem…",
    fallbackMessage: PROBLEM_IMPORT_FALLBACK,

    select: (body) => {
      const parsed = body as { ok?: boolean; problem?: ImportedProblem } | null;
      if (!parsed?.ok || !parsed.problem) return null;
      return { result: parsed.problem, unresolved: [], notice: null };
    },

    describe: () => "Filled from LeetCode",

    captureSnapshot: () => ({ url, slug, name, topicPattern, difficulty, notes }),

    restoreSnapshot: (snapshot) => {
      setUrl(snapshot.url ?? "");
      setSlug(snapshot.slug ?? "");
      setName(snapshot.name ?? "");
      setTopicPattern(snapshot.topicPattern ?? "");
      setDifficulty(snapshot.difficulty ?? "");
      setNotes(snapshot.notes ?? "");
      setDetailsOpen(true);
    },

    apply: (imported) => {
      if (imported.url) setUrl(imported.url);
      setSlug(imported.slug);
      setName(imported.title);
      setTopicPattern(topicPatternValue(imported.topic, imported.pattern));
      setDifficulty(imported.difficulty ?? "");
      onClearError("name");
      onClearError("topicPattern");
      onClearError("url");
      setDetailsOpen(isEdit);
    }
  });

  useEffect(() => {
    if (fieldErrors.name || fieldErrors.topicPattern) {
      setDetailsOpen(true);
    }
  }, [fieldErrors]);

  const showImportSummary =
    importer.phase === "success" && Boolean(name) && Boolean(topicPattern) && !detailsOpen;

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
            const value = event.target.value;
            setUrl(value);
            onClearError("url");
            importer.onUrlChange(value);
          }}
          onPaste={importer.onUrlPaste}
          onBlur={() => {
            importer.onUrlBlur(url);
          }}
        />
      </QuickAddField>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="difficulty" value={difficulty} />

      {isEdit ? (
        <button
          className="button secondary job-import-edit"
          disabled={saving || !looksLikeLeetCodeUrl(url)}
          onClick={() => importer.importNow(url)}
          type="button"
        >
          Re-import from link
        </button>
      ) : null}

      <ImportStatus
        message={importer.message}
        notice={importer.notice}
        onRetry={() => importer.importNow(url)}
        phase={importer.phase}
      />

      {showImportSummary ? (
        <div className="job-import-summary">
          <div>
            <p className="job-import-summary-title">{name}</p>
            <p className="job-import-summary-meta">
              {[difficulty, topicPattern].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="job-import-summary-actions">
            {importer.canUndo ? (
              <button className="button secondary job-import-edit" onClick={importer.undo} type="button">
                Undo
              </button>
            ) : null}
            <button
              className="button secondary job-import-edit"
              type="button"
              onClick={() => setDetailsOpen(true)}
            >
              Edit details
            </button>
          </div>
        </div>
      ) : null}

      {detailsOpen || importer.phase !== "success" ? (
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

const APPLICATION_FIELD_LABELS: Record<string, string> = {
  company: "company",
  role: "role",
  jobId: "job ID",
  location: "location"
};

/** Where an auto-filled value came from, shown next to the field label. */
function FieldSourceChip({ source }: { source?: FieldSource }) {
  if (!source || source === "manual") return null;
  const label = source === "api" ? "Board" : source === "url" ? "Link" : "Page";
  return <span className="job-import-chip">{label}</span>;
}

function ApplicationFields({
  application,
  resumeVersionId,
  onResumeVersionChange,
  fieldErrors,
  onClearError,
  saving
}: {
  application?: import("@/components/quick-add/entry-sheet-types").ApplicationEditData;
  resumeVersionId: string;
  onResumeVersionChange: (id: string) => void;
  fieldErrors: FieldErrors;
  onClearError: (name: string) => void;
  saving: boolean;
}) {
  const [status, setStatus] = useState(application?.status ?? "WISHLIST");
  const [jobUrl, setJobUrl] = useState(application?.jobUrl ?? "");
  const [company, setCompany] = useState(application?.company ?? "");
  const [role, setRole] = useState(application?.role ?? "");
  const [jobId, setJobId] = useState(application?.jobId ?? "");
  const [location, setLocation] = useState(application?.location ?? "");
  const [notes, setNotes] = useState(application?.notes ?? "");
  const [appliedAt, setAppliedAt] = useState(() =>
    application?.appliedAt
      ? calendarDayKey(new Date(application.appliedAt))
      : calendarDayKey(new Date())
  );
  const [detailsOpen, setDetailsOpen] = useState(Boolean(application));
  const [sources, setSources] = useState<Partial<Record<JobField, FieldSource>>>({});
  const isEdit = Boolean(application);

  function markManual(field: JobField) {
    setSources((current) => ({ ...current, [field]: "manual" }));
  }

  /**
   * Instant tier: everything the URL alone can tell us, applied synchronously so
   * fields populate the moment you paste. Only fills blanks — a guess must never
   * overwrite something you typed.
   */
  const applyUrlFacts = useCallback(
    (value: string) => {
      const facts = parseJobUrl(value);
      if (!facts) return;

      const filled: Partial<Record<JobField, FieldSource>> = {};
      if (!company.trim() && facts.company) {
        setCompany(facts.company);
        filled.company = "url";
      }
      if (!role.trim() && facts.role) {
        setRole(facts.role);
        filled.role = "url";
      }
      if (!jobId.trim() && facts.jobId) {
        setJobId(facts.jobId);
        filled.jobId = "url";
      }
      if (!location.trim() && facts.location) {
        setLocation(facts.location);
        filled.location = "url";
      }

      if (Object.keys(filled).length > 0) {
        // Existing (stronger) provenance wins over a fresh guess.
        setSources((current) => ({ ...filled, ...current }));
      }
    },
    [company, role, jobId, location]
  );

  const importer = useUrlImport<JobImportSuccess>({
    endpoint: "/api/jobs/import",
    isSupportedUrl: looksLikeJobUrl,
    // Never auto-clobber an application that already exists; edit mode gets an
    // explicit "Re-import" button instead.
    autoRun: !isEdit,
    disabled: saving,
    loadingMessage: JOB_IMPORT_MESSAGES.loading,
    fallbackMessage: JOB_IMPORT_MESSAGES.noData,

    select: (body) => {
      const parsed = body as JobImportSuccess | null;
      if (!parsed || parsed.ok !== true) return null;
      return { result: parsed, unresolved: parsed.unresolved, notice: parsed.notice?.message ?? null };
    },

    describe: (outcome) => {
      const missing = outcome.unresolved.map((field) => APPLICATION_FIELD_LABELS[field] ?? field);
      if (!missing.length) return "Filled from the job link";
      return `Filled what we could — add the ${missing.join(" and ")}`;
    },

    captureSnapshot: () => ({ jobUrl, company, role, jobId, location, notes }),

    restoreSnapshot: (snapshot) => {
      setJobUrl(snapshot.jobUrl ?? "");
      setCompany(snapshot.company ?? "");
      setRole(snapshot.role ?? "");
      setJobId(snapshot.jobId ?? "");
      setLocation(snapshot.location ?? "");
      setNotes(snapshot.notes ?? "");
      setSources({});
      setDetailsOpen(true);
    },

    apply: (parsed) => {
      const job = parsed.job;
      setJobUrl(job.jobUrl);
      // Only ever write values we actually resolved — an import that found no
      // job ID must not wipe one the user typed.
      if (job.company) setCompany(job.company);
      if (job.role) setRole(job.role);
      if (job.jobId) setJobId(job.jobId);
      if (job.location) setLocation(job.location);
      if (job.description) {
        const snippet = job.description.slice(0, 500);
        setNotes((current) => (current.trim() ? current : snippet));
      }

      const next: Partial<Record<JobField, FieldSource>> = {};
      for (const [field, entry] of Object.entries(parsed.provenance)) {
        if (entry) next[field as JobField] = entry.source;
      }
      setSources(next);

      for (const field of ["company", "role", "jobId", "jobUrl", "location"]) onClearError(field);
      // Anything the import couldn't resolve still needs the user, so keep the
      // detail fields open rather than collapsing to the summary card.
      setDetailsOpen(parsed.unresolved.length > 0 || isEdit);
    }
  });

  useEffect(() => {
    if (fieldErrors.company || fieldErrors.role || fieldErrors.jobId || fieldErrors.location) {
      setDetailsOpen(true);
    }
  }, [fieldErrors]);

  const showImportSummary = importer.phase === "success" && Boolean(company) && Boolean(role) && !detailsOpen;

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
            const value = event.target.value;
            setJobUrl(value);
            onClearError("jobUrl");
            applyUrlFacts(value);
            importer.onUrlChange(value);
          }}
          onPaste={(event) => {
            // Fill from the link before the network call even starts.
            const pasted = event.clipboardData.getData("text");
            if (pasted) applyUrlFacts(pasted);
            importer.onUrlPaste(event);
          }}
          onBlur={() => {
            importer.onUrlBlur(jobUrl);
          }}
        />
      </QuickAddField>

      {isEdit ? (
        <button
          className="button secondary job-import-edit"
          disabled={saving || !looksLikeJobUrl(jobUrl)}
          onClick={() => importer.importNow(jobUrl)}
          type="button"
        >
          Re-import from link
        </button>
      ) : null}

      <ImportStatus
        message={importer.message}
        notice={importer.notice}
        onRetry={() => importer.importNow(jobUrl)}
        phase={importer.phase}
      />

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
          <div className="job-import-summary-actions">
            {importer.canUndo ? (
              <button className="button secondary job-import-edit" onClick={importer.undo} type="button">
                Undo
              </button>
            ) : null}
            <button
              className="button secondary job-import-edit"
              type="button"
              onClick={() => setDetailsOpen(true)}
            >
              Edit details
            </button>
          </div>
        </div>
      ) : null}

      {detailsOpen || importer.phase !== "success" ? (
        <>
          <QuickAddField
            error={fieldErrors.company}
            label={
              <>
                Company
                <FieldSourceChip source={sources.company} />
              </>
            }
            name="company"
            onClearError={onClearError}
          >
            <input
              name="company"
              placeholder="Stripe"
              autoComplete="organization"
              value={company}
              onChange={(event) => {
                setCompany(event.target.value);
                markManual("company");
                onClearError("company");
              }}
            />
          </QuickAddField>
          <QuickAddField
            error={fieldErrors.role}
            label={
              <>
                Role
                <FieldSourceChip source={sources.role} />
              </>
            }
            name="role"
            onClearError={onClearError}
          >
            <input
              name="role"
              placeholder="Software Engineer"
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                markManual("role");
                onClearError("role");
              }}
            />
          </QuickAddField>
          <QuickAddField
            error={fieldErrors.jobId}
            label={
              <>
                Job ID
                <FieldSourceChip source={sources.jobId} />
              </>
            }
            name="jobId"
            onClearError={onClearError}
          >
            <input
              name="jobId"
              placeholder="REQ-23918"
              value={jobId}
              onChange={(event) => {
                setJobId(event.target.value);
                markManual("jobId");
                onClearError("jobId");
              }}
            />
          </QuickAddField>
          <QuickAddField
            error={fieldErrors.location}
            label={
              <>
                Location
                <FieldSourceChip source={sources.location} />
              </>
            }
            name="location"
            onClearError={onClearError}
          >
            <input
              name="location"
              placeholder="San Francisco, CA"
              value={location}
              onChange={(event) => {
                setLocation(event.target.value);
                markManual("location");
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
      {status === "WISHLIST" ? (
        // Nothing has been applied to yet; the empty value clears any stored date.
        <input type="hidden" name="appliedAt" value="" />
      ) : (
        <QuickAddField
          error={fieldErrors.appliedAt}
          label="Applied on"
          name="appliedAt"
          onClearError={onClearError}
        >
          <input
            className="quick-add-date"
            max={calendarDayKey(new Date())}
            name="appliedAt"
            onChange={(event) => {
              setAppliedAt(event.target.value);
              onClearError("appliedAt");
            }}
            type="date"
            value={appliedAt}
          />
        </QuickAddField>
      )}
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
  /** ReactNode so callers can append a provenance chip beside the text. */
  label: ReactNode;
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
