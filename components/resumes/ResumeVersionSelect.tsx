"use client";

import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { ONE_OFF_RESUME_LABEL, type ResumeVersionRow } from "@/lib/resume-library";
import { toastError, toastSuccess } from "@/lib/toast";

/** How a freshly uploaded file should be stored. No default — the user must choose. */
type UploadIntent = "oneOff" | "library";

type ResumeVersionSelectProps = {
  value: string;
  onChange: (resumeVersionId: string) => void;
  resumes: ResumeVersionRow[];
  onResumesChange: (resumes: ResumeVersionRow[]) => void;
  disabled?: boolean;
  error?: string;
};

export function ResumeVersionSelect({
  value,
  onChange,
  resumes,
  onResumesChange,
  disabled,
  error
}: ResumeVersionSelectProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [intent, setIntent] = useState<UploadIntent | null>(null);
  // A one-off is deliberately absent from `resumes`, so remember it to render as selected.
  const [oneOffId, setOneOffId] = useState("");
  const active = resumes.filter((resume) => !resume.archived);
  const selectedMissingFromLibrary = Boolean(value && !active.some((resume) => resume.id === value));
  const selectedIsOneOff = Boolean(value) && value === oneOffId;
  const needsFirstUpload = active.length === 0 && !selectedMissingFromLibrary;
  const uploadOpen = needsFirstUpload || showUpload;

  // Editing an application that already holds a one-off: the row isn't in `resumes`,
  // so ask the server what it is rather than calling it a vague "not in library" file.
  useEffect(() => {
    if (!value || !selectedMissingFromLibrary || value === oneOffId) return;

    let cancelled = false;
    void fetch(`/api/resumes/${value}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (!cancelled && body?.resume?.oneOff) setOneOffId(body.resume.id);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [oneOffId, selectedMissingFromLibrary, value]);

  async function upload(file: File) {
    if (!intent) return;

    setUploading(true);
    try {
      const oneOff = intent === "oneOff";
      const formData = new FormData();
      formData.append("file", file);
      if (oneOff) formData.append("oneOff", "1");
      if (!oneOff && uploadName.trim()) formData.append("name", uploadName.trim());

      const response = await fetch("/api/resumes", { method: "POST", body: formData });
      const body = await response.json().catch(() => ({ error: "Could not upload resume." }));
      if (!response.ok) {
        toastError(body.error ?? "Could not upload resume.");
        return;
      }

      if (oneOff) {
        // Never goes into the library options — this application is its only home.
        setOneOffId(body.resume.id);
      } else {
        const next = [
          body.resume as ResumeVersionRow,
          ...resumes.filter((item) => item.id !== body.resume.id)
        ];
        onResumesChange(next);
        setOneOffId("");
      }

      onChange(body.resume.id);
      setShowUpload(false);
      setUploadName("");
      setIntent(null);
      if (fileRef.current) fileRef.current.value = "";
      toastSuccess(oneOff ? "Custom resume attached" : "Resume version uploaded");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={`quick-add-field-block${error ? " has-error" : ""}`} data-field="resumeVersionId">
      <span className="quick-add-label">Resume version</span>

      {needsFirstUpload ? (
        <p className="field-hint">
          No resume versions yet. Upload your first one to link it to this application.
        </p>
      ) : (
        <select
          disabled={disabled || uploading}
          onChange={(event) => {
            if (event.target.value === "__upload__") {
              setShowUpload(true);
              return;
            }
            onChange(event.target.value);
            setShowUpload(false);
          }}
          value={value}
        >
          <option value="">No resume</option>
          {selectedMissingFromLibrary ? (
            <option value={value}>
              {selectedIsOneOff ? ONE_OFF_RESUME_LABEL : "Current attachment (not in library)"}
            </option>
          ) : null}
          {active.map((resume) => (
            <option key={resume.id} value={resume.id}>
              {resume.label}
            </option>
          ))}
          <option value="__upload__">+ Upload new version</option>
        </select>
      )}

      {uploadOpen ? (
        <div className="resume-inline-upload">
          <div className="resume-intent" role="radiogroup" aria-label="How should this resume be saved?">
            <button
              aria-checked={intent === "oneOff"}
              className={`resume-intent-option${intent === "oneOff" ? " active" : ""}`}
              disabled={uploading}
              onClick={() => setIntent("oneOff")}
              role="radio"
              type="button"
            >
              <span className="resume-intent-title">Use for this application only</span>
              <span className="resume-intent-hint">Stays out of your library</span>
            </button>
            <button
              aria-checked={intent === "library"}
              className={`resume-intent-option${intent === "library" ? " active" : ""}`}
              disabled={uploading}
              onClick={() => setIntent("library")}
              role="radio"
              type="button"
            >
              <span className="resume-intent-title">Save as a new version</span>
              <span className="resume-intent-hint">Reusable on future applications</span>
            </button>
          </div>

          {intent === "library" ? (
            <input
              onChange={(event) => setUploadName(event.target.value)}
              placeholder="Name (e.g. Backend Resume)"
              type="text"
              value={uploadName}
            />
          ) : null}
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
          <div className="resume-inline-upload-actions">
            <button
              className="button compact"
              disabled={uploading || disabled || !intent}
              onClick={() => fileRef.current?.click()}
              type="button"
            >
              <Upload size={14} />
              {uploading ? "Uploading…" : needsFirstUpload ? "Upload first resume" : "Choose file"}
            </button>
            {!needsFirstUpload ? (
              <button
                className="button secondary compact"
                disabled={uploading}
                onClick={() => {
                  setShowUpload(false);
                  setIntent(null);
                }}
                type="button"
              >
                Cancel
              </button>
            ) : null}
          </div>
          {!intent ? <p className="field-hint">Pick an option above to choose a file.</p> : null}
        </div>
      ) : null}

      {error ? (
        <span className="quick-add-field-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

type ResumeVersionSelectLoaderProps = Omit<ResumeVersionSelectProps, "resumes" | "onResumesChange"> & {
  initialResumes?: ResumeVersionRow[];
};

/** Loads library options once when mounted; use when parent doesn't already have the list. */
export function ResumeVersionSelectLoader({
  initialResumes = [],
  ...props
}: ResumeVersionSelectLoaderProps) {
  const [resumes, setResumes] = useState<ResumeVersionRow[]>(initialResumes);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/resumes")
      .then((response) => response.json())
      .then((body) => {
        if (!cancelled && Array.isArray(body.resumes)) setResumes(body.resumes);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return <ResumeVersionSelect {...props} onResumesChange={setResumes} resumes={resumes} />;
}
