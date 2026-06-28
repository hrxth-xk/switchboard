"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ReviewScheduleField } from "@/components/dsa/ReviewScheduleField";
import { CONFIDENCE_LABELS, formatShortDate, type ProblemRow } from "@/lib/problem-utils";
import type { ReviewPreset } from "@/lib/review-schedule";

type ProblemEditorProps = {
  problem: ProblemRow;
  onClose: () => void;
};

export function ProblemEditor({ problem, onClose }: ProblemEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reviewSchedule, setReviewSchedule] = useState<{ reviewPreset?: ReviewPreset; customReviewDate?: string }>({
    reviewPreset: "oneWeek"
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  async function save(formData: FormData) {
    setLoading(true);
    setError("");

    const payload: Record<string, string | number> = {
      name: String(formData.get("name") ?? ""),
      url: String(formData.get("url") ?? ""),
      topic: String(formData.get("topic") ?? ""),
      pattern: String(formData.get("pattern") ?? ""),
      confidence: Number(formData.get("confidence") ?? problem.confidence),
      notes: String(formData.get("notes") ?? ""),
      lastPracticed: String(formData.get("lastPracticed") ?? ""),
      revisitCount: Number(formData.get("revisitCount") ?? problem.revisitCount)
    };

    if (reviewSchedule.customReviewDate) {
      payload.customReviewDate = reviewSchedule.customReviewDate;
    } else if (reviewSchedule.reviewPreset) {
      payload.reviewPreset = reviewSchedule.reviewPreset;
    }

    const response = await fetch(`/api/problems/${problem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setLoading(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Could not save changes." }));
      setError(body.error);
      return;
    }

    onClose();
    router.refresh();
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal modal-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="problem-editor-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 className="panel-title" id="problem-editor-title">
              {problem.name}
            </h2>
            <p className="panel-kicker">
              {problem.nextReview ? `Next review ${formatShortDate(problem.nextReview)}` : "No review scheduled"}
            </p>
          </div>
          <button className="icon-button secondary modal-close" type="button" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form action={save} className="form-grid">
          {error ? <div className="error wide">{error}</div> : null}

          <label className="field wide">
            <span>Problem name</span>
            <input name="name" defaultValue={problem.name} required />
          </label>
          <label className="field wide">
            <span>Problem URL</span>
            <input name="url" type="url" defaultValue={problem.url ?? ""} placeholder="https://..." />
          </label>
          <label className="field">
            <span>Topic</span>
            <input name="topic" defaultValue={problem.topic} required />
          </label>
          <label className="field">
            <span>Pattern</span>
            <input name="pattern" defaultValue={problem.pattern ?? ""} placeholder="Two pointers, BFS..." />
          </label>
          <label className="field">
            <span>Confidence</span>
            <select name="confidence" defaultValue={String(problem.confidence)}>
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} — {CONFIDENCE_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Revisit count</span>
            <input name="revisitCount" type="number" min="1" defaultValue={problem.revisitCount} required />
          </label>
          <label className="field">
            <span>Last practiced</span>
            <input name="lastPracticed" type="date" defaultValue={problem.lastPracticed.slice(0, 10)} required />
          </label>
          <label className="field wide">
            <span>Notes</span>
            <textarea name="notes" defaultValue={problem.notes ?? ""} placeholder="Approach, pitfalls, variants..." />
          </label>

          <ReviewScheduleField
            currentReviewLabel={problem.nextReview ? formatShortDate(problem.nextReview) : null}
            onChange={setReviewSchedule}
          />

          <button className="button wide" disabled={loading} type="submit">
            {loading ? "Saving" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
