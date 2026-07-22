"use client";

import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import type { ResumeVersionRow } from "@/lib/resume-library";
import { toastError, toastSuccess } from "@/lib/toast";

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
  const active = resumes.filter((resume) => !resume.archived);
  const selectedMissingFromLibrary = Boolean(value && !active.some((resume) => resume.id === value));
  const needsFirstUpload = active.length === 0 && !selectedMissingFromLibrary;
  const uploadOpen = needsFirstUpload || showUpload;

  async function upload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (uploadName.trim()) formData.append("name", uploadName.trim());

      const response = await fetch("/api/resumes", { method: "POST", body: formData });
      const body = await response.json().catch(() => ({ error: "Could not upload resume." }));
      if (!response.ok) {
        toastError(body.error ?? "Could not upload resume.");
        return;
      }

      const next = [body.resume as ResumeVersionRow, ...resumes.filter((item) => item.id !== body.resume.id)];
      onResumesChange(next);
      onChange(body.resume.id);
      setShowUpload(false);
      setUploadName("");
      if (fileRef.current) fileRef.current.value = "";
      toastSuccess("Resume version uploaded");
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
            <option value={value}>Current attachment (not in library)</option>
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
          <input
            onChange={(event) => setUploadName(event.target.value)}
            placeholder="Name (e.g. Backend Resume)"
            type="text"
            value={uploadName}
          />
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
              disabled={uploading || disabled}
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
                onClick={() => setShowUpload(false)}
                type="button"
              >
                Cancel
              </button>
            ) : null}
          </div>
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
